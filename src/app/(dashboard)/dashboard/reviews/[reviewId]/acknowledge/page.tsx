import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { performanceReviews, reviewPeriods } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { AcknowledgeForm } from '@/components/reviews/AcknowledgeForm';

interface Props { params: Promise<{ reviewId: string }> }

export default async function AcknowledgePage({ params }: Props) {
  const user = await requireAuth();
  const { reviewId } = await params;

  const [review] = await db
    .select()
    .from(performanceReviews)
    .where(and(eq(performanceReviews.id, reviewId), eq(performanceReviews.employeeId, user.id)));

  if (!review) notFound();
  if (review.employeeAcknowledged) redirect(`/dashboard/reviews`);
  if (review.supervisorRatingStatus !== 'submitted') redirect('/dashboard/reviews');

  const [period] = await db.select().from(reviewPeriods).where(eq(reviewPeriods.id, review.reviewPeriodId));

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/reviews" className="hover:text-slate-900">My Reviews</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 font-medium">Acknowledge — {period?.periodName}</span>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Acknowledge Review</h1>
        <p className="text-slate-500 mt-1">Review your performance evaluation and acknowledge it.</p>
      </div>
      <AcknowledgeForm
        reviewId={reviewId}
        periodName={period?.periodName ?? ''}
        finalScore={review.finalScore ?? null}
        performanceGrade={review.performanceGrade ?? null}
        strengths={review.strengths ?? null}
        improvementAreas={review.improvementAreas ?? null}
        actionPlan={review.actionPlan ?? null}
        supervisorComments={review.supervisorComments ?? null}
      />
    </div>
  );
}
