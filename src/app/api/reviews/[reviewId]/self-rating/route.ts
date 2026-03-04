import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  performanceReviews, performanceRatings, kpiCriteria, kpiTemplates, employees, notifications
} from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { calculateWeightedScore, getAngleWeight, getPerformanceGrade } from '@/utils/score';
import type { KpiAngle } from '@/types';

const ratingSchema = z.object({
  criterionId: z.string().uuid(),
  selfRating: z.number().int().min(0).max(10),
  selfComments: z.string().optional().nullable(),
});

const submitSchema = z.object({
  ratings: z.array(ratingSchema),
  selfRatingNotes: z.string().optional().nullable(),
  draft: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const user = await requireAuth();
    const { reviewId } = await params;

    const [review] = await db
      .select()
      .from(performanceReviews)
      .where(and(eq(performanceReviews.id, reviewId), eq(performanceReviews.companyId, user.companyId)));

    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    if (review.employeeId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (review.selfRatingStatus === 'submitted') {
      return NextResponse.json({ error: 'Self-rating already submitted' }, { status: 409 });
    }

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
    }

    const { ratings, selfRatingNotes, draft } = parsed.data;

    // Get template + criteria for score calculation
    const [template] = await db
      .select()
      .from(kpiTemplates)
      .where(eq(kpiTemplates.id, review.templateId));

    const criteria = await db
      .select()
      .from(kpiCriteria)
      .where(eq(kpiCriteria.templateId, review.templateId));

    if (!draft) {
      const requiredCriteriaIds = criteria.filter(c => c.isRequired).map(c => c.id);
      const ratedIds = new Set(ratings.map(r => r.criterionId));
      const missing = requiredCriteriaIds.filter(id => !ratedIds.has(id));
      if (missing.length > 0) {
        return NextResponse.json({ error: `${missing.length} required criteria not rated` }, { status: 400 });
      }
    }

    // Upsert ratings
    for (const r of ratings) {
      const criterion = criteria.find(c => c.id === r.criterionId);
      if (!criterion) continue;

      const angleWeight = getAngleWeight(template, criterion.angle as KpiAngle);
      const criterionWeight = parseFloat(criterion.weight);
      const selfWeighted = calculateWeightedScore(r.selfRating, criterionWeight, angleWeight);

      const existing = await db
        .select({ id: performanceRatings.id })
        .from(performanceRatings)
        .where(and(eq(performanceRatings.reviewId, reviewId), eq(performanceRatings.criterionId, r.criterionId)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(performanceRatings)
          .set({
            selfRating: r.selfRating,
            selfComments: r.selfComments ?? null,
            selfWeightedScore: String(selfWeighted),
            updatedAt: new Date(),
          })
          .where(eq(performanceRatings.id, existing[0].id));
      } else {
        await db.insert(performanceRatings).values({
          reviewId,
          criterionId: r.criterionId,
          selfRating: r.selfRating,
          selfComments: r.selfComments ?? null,
          selfWeightedScore: String(selfWeighted),
        });
      }
    }

    // Calculate total
    const allRatings = await db
      .select()
      .from(performanceRatings)
      .where(eq(performanceRatings.reviewId, reviewId));

    const selfTotal = allRatings.reduce((sum, r) => sum + parseFloat(r.selfWeightedScore ?? '0'), 0);

    await db
      .update(performanceReviews)
      .set({
        selfRatingStatus: draft ? 'in_progress' : 'submitted',
        selfRatingSubmittedAt: draft ? null : new Date(),
        selfTotalScore: String(Math.round(selfTotal * 100) / 100),
        selfRatingNotes: selfRatingNotes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(performanceReviews.id, reviewId));

    // Notify supervisor if submitted
    if (!draft && review.supervisorId) {
      const [supervisorRows] = await db
        .select({ id: employees.id, fullName: employees.fullName })
        .from(employees)
        .where(eq(employees.id, review.supervisorId));

      if (supervisorRows) {
        await db.insert(notifications).values({
          companyId: user.companyId,
          userId: review.supervisorId,
          type: 'review_submitted',
          title: 'Self-Rating Submitted',
          message: `${user.fullName} has submitted their self-rating. Please complete your supervisor review.`,
          actionUrl: `/dashboard/reviews/${reviewId}/supervisor-rating`,
        });
      }
    }

    return NextResponse.json({ success: true, selfTotalScore: selfTotal, draft });
  } catch (err) {
    console.error('[self-rating]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
