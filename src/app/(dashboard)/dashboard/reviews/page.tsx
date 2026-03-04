import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { performanceReviews, reviewPeriods, employees, kpiTemplates } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GRADE_COLORS } from '@/utils/score';
import type { PerformanceGrade } from '@/types';
import { ClipboardList, ChevronRight } from 'lucide-react';

export const metadata = { title: 'My Reviews' };

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted: 'Submitted',
};

const STATUS_COLORS = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-green-100 text-green-800',
};

export default async function ReviewsPage() {
  const user = await requireAuth();

  const myReviews = await db
    .select({
      id: performanceReviews.id,
      selfRatingStatus: performanceReviews.selfRatingStatus,
      supervisorRatingStatus: performanceReviews.supervisorRatingStatus,
      selfTotalScore: performanceReviews.selfTotalScore,
      supervisorTotalScore: performanceReviews.supervisorTotalScore,
      finalScore: performanceReviews.finalScore,
      performanceGrade: performanceReviews.performanceGrade,
      employeeAcknowledged: performanceReviews.employeeAcknowledged,
      createdAt: performanceReviews.createdAt,
      periodName: reviewPeriods.periodName,
      year: reviewPeriods.year,
      month: reviewPeriods.month,
      reviewDueDate: reviewPeriods.reviewDueDate,
      periodStatus: reviewPeriods.status,
      templateName: kpiTemplates.name,
    })
    .from(performanceReviews)
    .innerJoin(reviewPeriods, eq(performanceReviews.reviewPeriodId, reviewPeriods.id))
    .innerJoin(kpiTemplates, eq(performanceReviews.templateId, kpiTemplates.id))
    .where(eq(performanceReviews.employeeId, user.id))
    .orderBy(desc(reviewPeriods.year), desc(reviewPeriods.month));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Reviews</h1>
        <p className="text-slate-500 mt-1">Track your performance review history.</p>
      </div>

      {myReviews.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No reviews yet. Reviews are generated monthly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myReviews.map(r => {
            const selfDone = r.selfRatingStatus === 'submitted';
            const supDone = r.supervisorRatingStatus === 'submitted';
            const acked = r.employeeAcknowledged;
            const isOpen = r.periodStatus === 'open';

            let actionHref = `/dashboard/reviews/${r.id}`;
            let actionLabel = 'View';
            if (isOpen && !selfDone) { actionHref = `/dashboard/reviews/${r.id}/self-rating`; actionLabel = 'Start Self-Rating'; }
            else if (isOpen && selfDone && supDone && !acked) { actionHref = `/dashboard/reviews/${r.id}/acknowledge`; actionLabel = 'Acknowledge'; }

            return (
              <Card key={r.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{r.periodName}</h3>
                        {r.performanceGrade && (
                          <Badge className={`text-xs font-bold ${GRADE_COLORS[r.performanceGrade as PerformanceGrade]}`}>
                            Grade {r.performanceGrade}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${STATUS_COLORS[r.selfRatingStatus]}`}>
                          Self: {STATUS_LABELS[r.selfRatingStatus]}
                        </Badge>
                        <Badge className={`text-xs ${STATUS_COLORS[r.supervisorRatingStatus]}`}>
                          Supervisor: {STATUS_LABELS[r.supervisorRatingStatus]}
                        </Badge>
                        {acked && <Badge className="text-xs bg-indigo-100 text-indigo-800">Acknowledged</Badge>}
                      </div>
                      <div className="flex gap-4 mt-1.5 text-xs text-slate-500 flex-wrap">
                        <span>Template: {r.templateName}</span>
                        <span>Due: {r.reviewDueDate}</span>
                        {r.selfTotalScore && <span>Self Score: {parseFloat(r.selfTotalScore).toFixed(1)}</span>}
                        {r.finalScore && <span>Final Score: {parseFloat(r.finalScore).toFixed(1)}</span>}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0 gap-1">
                      <Link href={actionHref}>
                        {actionLabel}<ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
