import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { performanceReviews, reviewPeriods, kpiTemplates, kpiCriteria, performanceRatings, employees } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GRADE_COLORS, ANGLE_LABELS, ANGLE_COLORS, getRatingVariance } from '@/utils/score';
import type { PerformanceGrade, KpiAngle } from '@/types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props { params: Promise<{ reviewId: string }> }

const VARIANCE_BADGE = {
  agree: 'bg-green-100 text-green-800',
  minor: 'bg-yellow-100 text-yellow-800',
  major: 'bg-red-100 text-red-800',
};

export default async function ReviewDetailPage({ params }: Props) {
  const user = await requireAuth();
  const { reviewId } = await params;

  const [review] = await db
    .select()
    .from(performanceReviews)
    .where(and(
      eq(performanceReviews.id, reviewId),
      eq(performanceReviews.companyId, user.companyId),
    ));

  if (!review) notFound();

  // Only the employee or their supervisor (or admin) can view
  const canView =
    review.employeeId === user.id ||
    review.supervisorId === user.id ||
    user.role === 'super_admin';
  if (!canView) notFound();

  const [period] = await db.select().from(reviewPeriods).where(eq(reviewPeriods.id, review.reviewPeriodId));
  const [template] = await db.select().from(kpiTemplates).where(eq(kpiTemplates.id, review.templateId));
  const criteria = await db.select().from(kpiCriteria).where(eq(kpiCriteria.templateId, review.templateId)).orderBy(asc(kpiCriteria.sortOrder));
  const ratings = await db.select().from(performanceRatings).where(eq(performanceRatings.reviewId, reviewId));
  const [employee] = await db.select().from(employees).where(eq(employees.id, review.employeeId));

  const angles = ['commitment', 'contribution', 'character', 'competency'] as KpiAngle[];
  const criteriaByAngle: Record<KpiAngle, typeof criteria> = { commitment: [], contribution: [], character: [], competency: [] };
  for (const c of criteria) criteriaByAngle[c.angle].push(c);

  const isEmployee = review.employeeId === user.id;

  return (
    <div className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href={isEmployee ? '/dashboard/reviews' : '/dashboard/team-reviews'} className="hover:text-slate-900 truncate">
          {isEmployee ? 'My Reviews' : 'Team Reviews'}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" />
        <span className="text-slate-900 font-medium truncate">{period?.periodName}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{period?.periodName}</h1>
          {!isEmployee && <p className="text-slate-500 mt-0.5">{employee?.fullName}</p>}
        </div>
        {review.performanceGrade && (
          <Badge className={`text-base sm:text-lg px-3 sm:px-4 py-1 font-bold shrink-0 ${GRADE_COLORS[review.performanceGrade as PerformanceGrade]}`}>
            Grade {review.performanceGrade}
          </Badge>
        )}
      </div>

      {/* Scores summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Self Score</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {review.selfTotalScore ? parseFloat(review.selfTotalScore).toFixed(1) : '—'}
            </p>
            <p className={`text-xs mt-1 capitalize ${review.selfRatingStatus === 'submitted' ? 'text-green-600' : 'text-slate-400'}`}>
              {review.selfRatingStatus.replace('_', ' ')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Supervisor Score</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {review.supervisorTotalScore ? parseFloat(review.supervisorTotalScore).toFixed(1) : '—'}
            </p>
            <p className={`text-xs mt-1 capitalize ${review.supervisorRatingStatus === 'submitted' ? 'text-green-600' : 'text-slate-400'}`}>
              {review.supervisorRatingStatus.replace('_', ' ')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Final Score</p>
            <p className="text-xl font-bold text-indigo-700 mt-1">
              {review.finalScore ? parseFloat(review.finalScore).toFixed(1) : '—'}
            </p>
            <p className={`text-xs mt-1 ${review.employeeAcknowledged ? 'text-green-600' : 'text-slate-400'}`}>
              {review.employeeAcknowledged ? 'Acknowledged' : 'Pending acknowledgment'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Criteria breakdown */}
      {criteria.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-900">Criteria Ratings</h2>
          {angles.map(angle => {
            const angleCriteria = criteriaByAngle[angle];
            if (angleCriteria.length === 0) return null;
            return (
              <div key={angle} className="border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b flex items-center gap-2">
                  <Badge className={`text-xs ${ANGLE_COLORS[angle]}`}>{ANGLE_LABELS[angle]}</Badge>
                </div>
                <div className="divide-y">
                  {angleCriteria.map(c => {
                    const r = ratings.find(rt => rt.criterionId === c.id);
                    const variance = getRatingVariance(r?.selfRating ?? null, r?.supervisorRating ?? null);
                    return (
                      <div key={c.id} className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900">{c.name}</p>
                            {c.nameEn && <p className="text-xs text-slate-500">{c.nameEn}</p>}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            {r?.selfRating != null && (
                              <div className="text-center">
                                <p className="text-xs text-slate-400">Self</p>
                                <p className="font-semibold text-slate-700">{r.selfRating}</p>
                              </div>
                            )}
                            {r?.supervisorRating != null && (
                              <div className="text-center">
                                <p className="text-xs text-slate-400">Supervisor</p>
                                <p className="font-semibold text-indigo-700">{r.supervisorRating}</p>
                              </div>
                            )}
                            {variance && (
                              <Badge className={`text-xs ${VARIANCE_BADGE[variance]}`}>
                                {variance === 'agree' ? <CheckCircle2 className="h-3 w-3 mr-1 inline" /> : <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                                {variance}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {(r?.selfComments || r?.supervisorComments) && (
                          <div className="mt-2 space-y-1 text-xs text-slate-500">
                            {r.selfComments && <p><span className="font-medium">Self:</span> {r.selfComments}</p>}
                            {r.supervisorComments && <p><span className="font-medium">Supervisor:</span> {r.supervisorComments}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback */}
      {(review.strengths || review.improvementAreas || review.actionPlan || review.supervisorComments) && (
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-900">Feedback</h2>
          {review.supervisorComments && (
            <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Overall Comments</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-700">{review.supervisorComments}</CardContent></Card>
          )}
          {review.strengths && (
            <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-green-700">Strengths</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-700">{review.strengths}</CardContent></Card>
          )}
          {review.improvementAreas && (
            <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-orange-700">Improvement Areas</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-700">{review.improvementAreas}</CardContent></Card>
          )}
          {review.actionPlan && (
            <Card><CardHeader className="pb-1"><CardTitle className="text-sm text-blue-700">Action Plan</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-700">{review.actionPlan}</CardContent></Card>
          )}
          {review.employeeComments && (
            <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Employee Response</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-700">{review.employeeComments}</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
