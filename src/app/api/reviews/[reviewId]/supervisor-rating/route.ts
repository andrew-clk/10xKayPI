import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  performanceReviews, performanceRatings, kpiCriteria, kpiTemplates, notifications
} from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { calculateWeightedScore, getAngleWeight, getPerformanceGrade } from '@/utils/score';
import type { KpiAngle, KpiTemplate } from '@/types';

const ratingSchema = z.object({
  criterionId: z.string().uuid(),
  supervisorRating: z.number().int().min(0).max(10),
  supervisorComments: z.string().optional().nullable(),
});

const submitSchema = z.object({
  ratings: z.array(ratingSchema),
  strengths: z.string().optional().nullable(),
  improvementAreas: z.string().optional().nullable(),
  actionPlan: z.string().optional().nullable(),
  supervisorComments: z.string().optional().nullable(),
  draft: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const user = await requireAuth();
    const { reviewId } = await params;

    const reviewResult = await db
      .select()
      .from(performanceReviews)
      .where(and(eq(performanceReviews.id, reviewId), eq(performanceReviews.companyId, user.companyId)));

    const review = reviewResult[0];

    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    if (user.role === 'employee') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (user.role === 'manager' && review.supervisorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (review.supervisorRatingStatus === 'submitted') {
      return NextResponse.json({ error: 'Supervisor rating already submitted' }, { status: 409 });
    }

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
    }

    const { ratings, strengths, improvementAreas, actionPlan, supervisorComments, draft } = parsed.data;

    const templateResult = await db.select().from(kpiTemplates).where(eq(kpiTemplates.id, review.templateId));
    const template = templateResult[0];
    const criteria = await db.select().from(kpiCriteria).where(eq(kpiCriteria.templateId, review.templateId));

    if (!draft) {
      const requiredIds = criteria.filter(c => c.isRequired).map(c => c.id);
      const ratedIds = new Set(ratings.map(r => r.criterionId));
      const missing = requiredIds.filter(id => !ratedIds.has(id));
      if (missing.length > 0) {
        return NextResponse.json({ error: `${missing.length} required criteria not rated` }, { status: 400 });
      }
    }

    // Upsert supervisor ratings
    for (const r of ratings) {
      const criterion = criteria.find(c => c.id === r.criterionId);
      if (!criterion) continue;

      const angleWeight = getAngleWeight(template as KpiTemplate, criterion.angle as KpiAngle);
      const criterionWeight = parseFloat(criterion.weight);
      const supervisorWeighted = calculateWeightedScore(r.supervisorRating, criterionWeight, angleWeight);

      const existing = await db
        .select({ id: performanceRatings.id })
        .from(performanceRatings)
        .where(and(eq(performanceRatings.reviewId, reviewId), eq(performanceRatings.criterionId, r.criterionId)))
        .limit(1);

      if (existing.length > 0) {
        await db.update(performanceRatings).set({
          supervisorRating: r.supervisorRating,
          supervisorComments: r.supervisorComments ?? null,
          supervisorWeightedScore: String(supervisorWeighted),
          updatedAt: new Date(),
        }).where(eq(performanceRatings.id, existing[0].id));
      } else {
        await db.insert(performanceRatings).values({
          reviewId,
          criterionId: r.criterionId,
          supervisorRating: r.supervisorRating,
          supervisorComments: r.supervisorComments ?? null,
          supervisorWeightedScore: String(supervisorWeighted),
        });
      }
    }

    const allRatings = await db.select().from(performanceRatings).where(eq(performanceRatings.reviewId, reviewId));
    const supervisorTotal = allRatings.reduce((sum, r) => sum + parseFloat(r.supervisorWeightedScore ?? '0'), 0);
    const roundedTotal = Math.round(supervisorTotal * 100) / 100;
    const grade = getPerformanceGrade(roundedTotal);

    await db.update(performanceReviews).set({
      supervisorRatingStatus: draft ? 'in_progress' : 'submitted',
      supervisorRatingSubmittedAt: draft ? null : new Date(),
      supervisorTotalScore: String(roundedTotal),
      finalScore: draft ? null : String(roundedTotal),
      performanceGrade: draft ? null : grade,
      strengths: strengths ?? null,
      improvementAreas: improvementAreas ?? null,
      actionPlan: actionPlan ?? null,
      supervisorComments: supervisorComments ?? null,
      updatedAt: new Date(),
    }).where(eq(performanceReviews.id, reviewId));

    if (!draft) {
      await db.insert(notifications).values({
        companyId: user.companyId,
        userId: review.employeeId,
        type: 'review_submitted',
        title: 'Your Performance Review is Ready',
        message: `Your review has been completed. Final score: ${roundedTotal}/100 (Grade ${grade}).`,
        actionUrl: `/dashboard/reviews/${reviewId}/acknowledge`,
      });
    }

    return NextResponse.json({ success: true, supervisorTotalScore: roundedTotal, grade, draft });
  } catch (err) {
    console.error('[supervisor-rating]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
