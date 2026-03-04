import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { reviewPeriods, performanceReviews } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ReviewPeriodsView } from '@/components/review-periods/ReviewPeriodsView';

export const metadata = { title: 'Review Periods' };

export default async function ReviewPeriodsPage() {
  const user = await requireAuth();
  if (user.role !== 'super_admin') redirect('/dashboard');

  const periods = await db
    .select()
    .from(reviewPeriods)
    .where(eq(reviewPeriods.companyId, user.companyId))
    .orderBy(desc(reviewPeriods.year), desc(reviewPeriods.month));

  const allReviews = await db
    .select({ periodId: performanceReviews.reviewPeriodId })
    .from(performanceReviews)
    .where(eq(performanceReviews.companyId, user.companyId));

  const countMap: Record<string, number> = {};
  for (const r of allReviews) {
    countMap[r.periodId] = (countMap[r.periodId] ?? 0) + 1;
  }

  const periodsWithCount = periods.map(p => ({
    ...p,
    reviewCount: countMap[p.id] ?? 0,
  }));

  return <ReviewPeriodsView initialPeriods={periodsWithCount} />;
}
