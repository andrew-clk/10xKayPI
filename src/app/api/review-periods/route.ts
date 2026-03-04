import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviewPeriods, performanceReviews, employees, kpiTemplates, notifications } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { format, addDays, parseISO } from 'date-fns';

const createSchema = z.object({
  periodName: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generateReviews: z.boolean().default(true),
});

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const periods = await db
      .select()
      .from(reviewPeriods)
      .where(eq(reviewPeriods.companyId, user.companyId))
      .orderBy(desc(reviewPeriods.year), desc(reviewPeriods.month));

    // Count reviews per period
    const allReviews = await db
      .select({ periodId: performanceReviews.reviewPeriodId })
      .from(performanceReviews)
      .where(eq(performanceReviews.companyId, user.companyId));

    const countMap: Record<string, number> = {};
    for (const r of allReviews) {
      countMap[r.periodId] = (countMap[r.periodId] ?? 0) + 1;
    }

    return NextResponse.json(periods.map(p => ({ ...p, reviewCount: countMap[p.id] ?? 0 })));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
    }

    const { periodName, year, month, startDate, endDate, reviewDueDate, generateReviews } = parsed.data;

    // Check for duplicate period
    const existing = await db
      .select({ id: reviewPeriods.id })
      .from(reviewPeriods)
      .where(and(
        eq(reviewPeriods.companyId, user.companyId),
        eq(reviewPeriods.year, year),
        eq(reviewPeriods.month, month),
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'A review period already exists for this month.' }, { status: 409 });
    }

    const [period] = await db.insert(reviewPeriods).values({
      companyId: user.companyId,
      periodName,
      year,
      month,
      startDate,
      endDate,
      reviewDueDate,
      status: 'open',
    }).returning();

    let reviewsCreated = 0;

    if (generateReviews) {
      const activeEmployees = await db
        .select()
        .from(employees)
        .where(and(eq(employees.companyId, user.companyId), eq(employees.status, 'active')));

      const templates = await db
        .select()
        .from(kpiTemplates)
        .where(and(eq(kpiTemplates.companyId, user.companyId), eq(kpiTemplates.isActive, true)));

      for (const emp of activeEmployees) {
        const template = templates.find(t => t.positionType === emp.position) ?? templates[0];
        if (!template) continue;

        try {
          const [review] = await db.insert(performanceReviews).values({
            companyId: user.companyId,
            employeeId: emp.id,
            reviewPeriodId: period.id,
            templateId: template.id,
            supervisorId: emp.supervisorId ?? null,
            selfRatingStatus: 'not_started',
            supervisorRatingStatus: 'not_started',
          }).returning();

          await db.insert(notifications).values({
            companyId: user.companyId,
            userId: emp.id,
            type: 'review_opened',
            title: `${periodName} Review Open`,
            message: `Your ${periodName} performance review is now open. Self-rating due ${format(parseISO(reviewDueDate), 'MMM d, yyyy')}.`,
            actionUrl: `/dashboard/reviews/${review.id}/self-rating`,
          });

          reviewsCreated++;
        } catch {
          // continue
        }
      }
    }

    return NextResponse.json({ ...period, reviewsCreated }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
