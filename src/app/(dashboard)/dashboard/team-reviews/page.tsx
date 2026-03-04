import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { performanceReviews, reviewPeriods, employees, kpiTemplates } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GRADE_COLORS } from '@/utils/score';
import type { PerformanceGrade } from '@/types';
import { ChevronRight, Users } from 'lucide-react';

export const metadata = { title: 'Team Reviews' };

const STATUS_COLORS = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-green-100 text-green-800',
};
const STATUS_LABELS = { not_started: 'Not Started', in_progress: 'In Progress', submitted: 'Submitted' };

export default async function TeamReviewsPage() {
  const user = await requireAuth();
  if (user.role === 'employee') redirect('/dashboard/reviews');

  // Admin sees all, manager sees their subordinates' reviews
  const whereClause = user.role === 'super_admin'
    ? eq(performanceReviews.companyId, user.companyId)
    : eq(performanceReviews.supervisorId, user.id);

  const reviews = await db
    .select({
      id: performanceReviews.id,
      selfRatingStatus: performanceReviews.selfRatingStatus,
      supervisorRatingStatus: performanceReviews.supervisorRatingStatus,
      finalScore: performanceReviews.finalScore,
      performanceGrade: performanceReviews.performanceGrade,
      employeeAcknowledged: performanceReviews.employeeAcknowledged,
      periodName: reviewPeriods.periodName,
      reviewDueDate: reviewPeriods.reviewDueDate,
      employeeName: employees.fullName,
      employeePosition: employees.position,
      employeeId: performanceReviews.employeeId,
    })
    .from(performanceReviews)
    .innerJoin(reviewPeriods, eq(performanceReviews.reviewPeriodId, reviewPeriods.id))
    .innerJoin(employees, eq(performanceReviews.employeeId, employees.id))
    .where(whereClause)
    .orderBy(desc(reviewPeriods.year), desc(reviewPeriods.month), employees.fullName);

  const pending = reviews.filter(r => r.selfRatingStatus === 'submitted' && r.supervisorRatingStatus !== 'submitted');
  const awaiting = reviews.filter(r => r.selfRatingStatus !== 'submitted');
  const completed = reviews.filter(r => r.supervisorRatingStatus === 'submitted');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team Reviews</h1>
        <p className="text-slate-500 mt-1">Review and rate your team members' performance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Your Rating', count: pending.length, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
          { label: 'Awaiting Self-Rating', count: awaiting.length, color: 'bg-slate-50 border-slate-200 text-slate-600' },
          { label: 'Completed', count: completed.length, color: 'bg-green-50 border-green-200 text-green-800' },
        ].map(s => (
          <div key={s.label} className={`border rounded-lg p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-sm mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No team reviews found.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-slate-900">Action Required — Rate These Reviews</h2>
              {pending.map(r => (
                <Card key={r.id} className="border-yellow-200 bg-yellow-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{r.employeeName}</p>
                        <p className="text-xs text-slate-500">{r.employeePosition} · {r.periodName} · Due: {r.reviewDueDate}</p>
                      </div>
                      <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1 shrink-0">
                        <Link href={`/dashboard/reviews/${r.id}/supervisor-rating`}>
                          Rate Now <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900">All Team Reviews</h2>
            {reviews.map(r => (
              <Card key={r.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-900">{r.employeeName}</p>
                        {r.performanceGrade && (
                          <Badge className={`text-xs font-bold ${GRADE_COLORS[r.performanceGrade as PerformanceGrade]}`}>
                            Grade {r.performanceGrade}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        <span>{r.periodName}</span>
                        <span>Self: <span className={`font-medium ${STATUS_COLORS[r.selfRatingStatus].includes('green') ? 'text-green-700' : ''}`}>{STATUS_LABELS[r.selfRatingStatus]}</span></span>
                        <span>Supervisor: <span className={`font-medium`}>{STATUS_LABELS[r.supervisorRatingStatus]}</span></span>
                        {r.finalScore && <span>Score: {parseFloat(r.finalScore).toFixed(1)}</span>}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0 gap-1">
                      <Link href={`/dashboard/reviews/${r.id}`}>
                        View <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
