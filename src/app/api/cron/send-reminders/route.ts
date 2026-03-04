import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performanceReviews, reviewPeriods, employees, kpiCriteria, performanceRatings } from '@/db/schema';
import { eq, and, lte, gte, ne, count } from 'drizzle-orm';
import { sendReminderEmail } from '@/lib/email';
import { differenceInDays, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Find open reviews with due dates within 7 days that are not yet submitted
  const pendingReviews = await db
    .select({
      reviewId: performanceReviews.id,
      employeeId: performanceReviews.employeeId,
      templateId: performanceReviews.templateId,
      companyId: performanceReviews.companyId,
      reviewDueDate: reviewPeriods.reviewDueDate,
      periodName: reviewPeriods.periodName,
      employeeEmail: employees.email,
      employeeName: employees.fullName,
    })
    .from(performanceReviews)
    .leftJoin(reviewPeriods, eq(performanceReviews.reviewPeriodId, reviewPeriods.id))
    .leftJoin(employees, eq(performanceReviews.employeeId, employees.id))
    .where(
      and(
        ne(performanceReviews.selfRatingStatus, 'submitted'),
        lte(reviewPeriods.reviewDueDate, in7Days),
        gte(reviewPeriods.reviewDueDate, todayStr)
      )
    );

  let sent = 0;
  for (const r of pendingReviews) {
    if (!r.employeeEmail || !r.reviewDueDate) continue;

    const daysLeft = differenceInDays(parseISO(r.reviewDueDate), today);
    if (daysLeft !== 7 && daysLeft !== 3 && daysLeft !== 1) continue;

    const [{ ratedCount }] = await db
      .select({ ratedCount: count(performanceRatings.id) })
      .from(performanceRatings)
      .where(and(
        eq(performanceRatings.reviewId, r.reviewId),
        ne(performanceRatings.selfRating, 0)
      ));

    const [{ totalCount }] = await db
      .select({ totalCount: count(kpiCriteria.id) })
      .from(kpiCriteria)
      .where(eq(kpiCriteria.templateId, r.templateId ?? ''));

    await sendReminderEmail(
      r.employeeEmail,
      r.employeeName ?? 'Employee',
      r.periodName ?? '',
      r.reviewDueDate,
      r.reviewId,
      daysLeft,
      Number(ratedCount),
      Number(totalCount)
    ).catch(console.error);

    sent++;
  }

  return NextResponse.json({ success: true, remindersSent: sent });
}
