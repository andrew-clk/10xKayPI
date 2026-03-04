import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  performanceReviews, performanceRatings, reviewPeriods,
  employees, kpiTemplates, kpiCriteria
} from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and, or, asc } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const user = await requireAuth();
    const { reviewId } = await params;

    const [review] = await db
      .select()
      .from(performanceReviews)
      .where(and(eq(performanceReviews.id, reviewId), eq(performanceReviews.companyId, user.companyId)));

    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Access control
    if (user.role === 'employee' && review.employeeId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (user.role === 'manager' && review.employeeId !== user.id && review.supervisorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [period] = await db.select().from(reviewPeriods).where(eq(reviewPeriods.id, review.reviewPeriodId));
    const [employee] = await db.select().from(employees).where(eq(employees.id, review.employeeId));
    const [supervisor] = review.supervisorId
      ? await db.select().from(employees).where(eq(employees.id, review.supervisorId))
      : [null];
    const [template] = await db.select().from(kpiTemplates).where(eq(kpiTemplates.id, review.templateId));

    const criteria = await db
      .select()
      .from(kpiCriteria)
      .where(eq(kpiCriteria.templateId, review.templateId))
      .orderBy(asc(kpiCriteria.sortOrder));

    const ratings = await db
      .select()
      .from(performanceRatings)
      .where(eq(performanceRatings.reviewId, reviewId));

    return NextResponse.json({
      ...review,
      reviewPeriod: period,
      employee,
      supervisor,
      template: { ...template, criteria },
      ratings,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
