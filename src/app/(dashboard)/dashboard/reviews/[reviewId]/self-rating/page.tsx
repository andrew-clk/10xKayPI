import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { performanceReviews, reviewPeriods, kpiTemplates, kpiCriteria, performanceRatings } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { SelfRatingForm } from '@/components/reviews/SelfRatingForm';
import type { PerformanceReview } from '@/types';

interface Props { params: Promise<{ reviewId: string }> }

export default async function SelfRatingPage({ params }: Props) {
  const user = await requireAuth();
  const { reviewId } = await params;

  const [review] = await db
    .select()
    .from(performanceReviews)
    .where(and(eq(performanceReviews.id, reviewId), eq(performanceReviews.employeeId, user.id)));

  if (!review) notFound();
  if (review.selfRatingStatus === 'submitted') redirect(`/dashboard/reviews/${reviewId}`);

  const [period] = await db.select().from(reviewPeriods).where(eq(reviewPeriods.id, review.reviewPeriodId));
  const [template] = await db.select().from(kpiTemplates).where(eq(kpiTemplates.id, review.templateId));
  const criteria = await db.select().from(kpiCriteria).where(eq(kpiCriteria.templateId, review.templateId)).orderBy(asc(kpiCriteria.sortOrder));
  const ratings = await db.select().from(performanceRatings).where(eq(performanceRatings.reviewId, reviewId));

  const fullReview = {
    ...review,
    reviewPeriod: period,
    template: { ...template, criteria },
    ratings,
  } as PerformanceReview;

  return (
    <div className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/reviews" className="hover:text-slate-900">My Reviews</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 font-medium">Self-Rating — {period?.periodName}</span>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Self-Rating</h1>
        <p className="text-slate-500 mt-1">
          {period?.periodName} · Due: {period?.reviewDueDate}
        </p>
      </div>
      <SelfRatingForm review={fullReview} />
    </div>
  );
}
