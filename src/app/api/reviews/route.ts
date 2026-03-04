import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performanceReviews, reviewPeriods, employees, kpiTemplates } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get('periodId');

    const conditions = [eq(performanceReviews.companyId, user.companyId)];

    if (periodId) conditions.push(eq(performanceReviews.reviewPeriodId, periodId));

    if (user.role === 'employee') {
      conditions.push(eq(performanceReviews.employeeId, user.id));
    } else if (user.role === 'manager') {
      conditions.push(
        or(
          eq(performanceReviews.employeeId, user.id),
          eq(performanceReviews.supervisorId, user.id)
        )!
      );
    }

    const reviews = await db
      .select({
        id: performanceReviews.id,
        companyId: performanceReviews.companyId,
        employeeId: performanceReviews.employeeId,
        reviewPeriodId: performanceReviews.reviewPeriodId,
        templateId: performanceReviews.templateId,
        supervisorId: performanceReviews.supervisorId,
        selfRatingStatus: performanceReviews.selfRatingStatus,
        selfRatingSubmittedAt: performanceReviews.selfRatingSubmittedAt,
        selfTotalScore: performanceReviews.selfTotalScore,
        supervisorRatingStatus: performanceReviews.supervisorRatingStatus,
        supervisorRatingSubmittedAt: performanceReviews.supervisorRatingSubmittedAt,
        supervisorTotalScore: performanceReviews.supervisorTotalScore,
        finalScore: performanceReviews.finalScore,
        performanceGrade: performanceReviews.performanceGrade,
        employeeAcknowledged: performanceReviews.employeeAcknowledged,
        createdAt: performanceReviews.createdAt,
        updatedAt: performanceReviews.updatedAt,
        periodName: reviewPeriods.periodName,
        periodYear: reviewPeriods.year,
        periodMonth: reviewPeriods.month,
        reviewDueDate: reviewPeriods.reviewDueDate,
        employeeName: employees.fullName,
        employeePosition: employees.position,
        templateName: kpiTemplates.name,
      })
      .from(performanceReviews)
      .leftJoin(reviewPeriods, eq(performanceReviews.reviewPeriodId, reviewPeriods.id))
      .leftJoin(employees, eq(performanceReviews.employeeId, employees.id))
      .leftJoin(kpiTemplates, eq(performanceReviews.templateId, kpiTemplates.id))
      .where(and(...conditions))
      .orderBy(desc(performanceReviews.createdAt));

    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
