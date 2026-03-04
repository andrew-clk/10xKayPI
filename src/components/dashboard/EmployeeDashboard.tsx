'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GRADE_COLORS } from '@/utils/score';
import type { Employee, PerformanceGrade } from '@/types';
import { ClipboardList, TrendingUp, CheckCircle2, ChevronRight } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Review {
  id: string;
  selfRatingStatus: string;
  supervisorRatingStatus: string;
  selfTotalScore: string | null;
  finalScore: string | null;
  performanceGrade: string | null;
  employeeAcknowledged: boolean;
  periodName: string;
  reviewDueDate: string;
  year: number;
  month: number;
}

interface Props {
  user: Employee;
  reviews: Review[];
}

const STATUS_COLORS = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-green-100 text-green-800',
};

export function EmployeeDashboard({ user, reviews }: Props) {
  const latestReview = reviews[0];
  const completedReviews = reviews.filter(r => r.finalScore);
  const latestScore = latestReview?.finalScore ? parseFloat(latestReview.finalScore) : null;
  const avgScore = completedReviews.length > 0
    ? completedReviews.reduce((sum, r) => sum + parseFloat(r.finalScore!), 0) / completedReviews.length
    : 0;

  const pendingAction = reviews.find(r =>
    r.selfRatingStatus !== 'submitted' ||
    (r.supervisorRatingStatus === 'submitted' && !r.employeeAcknowledged)
  );

  const chartData = [...completedReviews]
    .reverse()
    .slice(-6)
    .map(r => ({
      period: r.periodName.replace(/\s+\d{4}$/, ''),
      score: parseFloat(r.finalScore!),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {user.fullName.split(' ')[0]}
        </h1>
        <p className="text-slate-500 mt-1">{user.position}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{latestScore != null ? latestScore.toFixed(1) : '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">Latest Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50">
              <ClipboardList className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completedReviews.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Reviews Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{avgScore > 0 ? avgScore.toFixed(1) : '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">Average Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending action */}
      {pendingAction && (
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-indigo-900">Action Required</p>
              <p className="text-sm text-indigo-700 mt-0.5">
                {pendingAction.selfRatingStatus !== 'submitted'
                  ? `Complete your self-rating for ${pendingAction.periodName}`
                  : `Acknowledge your review for ${pendingAction.periodName}`
                }
              </p>
            </div>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1 shrink-0">
              <Link href={
                pendingAction.selfRatingStatus !== 'submitted'
                  ? `/dashboard/reviews/${pendingAction.id}/self-rating`
                  : `/dashboard/reviews/${pendingAction.id}/acknowledge`
              }>
                Start <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Score trend chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent reviews */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Reviews</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
            <Link href="/dashboard/reviews">All Reviews <ChevronRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>
        {reviews.length === 0 ? (
          <p className="text-slate-400 text-sm">No reviews yet. Reviews are generated monthly.</p>
        ) : reviews.slice(0, 5).map(r => (
          <Card key={r.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900">{r.periodName}</p>
                    {r.performanceGrade && (
                      <Badge className={`text-xs font-bold ${GRADE_COLORS[r.performanceGrade as PerformanceGrade]}`}>
                        Grade {r.performanceGrade}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-slate-500">
                    <Badge className={`text-xs ${STATUS_COLORS[r.selfRatingStatus as keyof typeof STATUS_COLORS]}`}>
                      Self: {r.selfRatingStatus.replace('_', ' ')}
                    </Badge>
                    {r.finalScore && <span>Score: {parseFloat(r.finalScore).toFixed(1)}</span>}
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="gap-1 shrink-0">
                  <Link href={
                    r.selfRatingStatus !== 'submitted'
                      ? `/dashboard/reviews/${r.id}/self-rating`
                      : r.supervisorRatingStatus === 'submitted' && !r.employeeAcknowledged
                      ? `/dashboard/reviews/${r.id}/acknowledge`
                      : `/dashboard/reviews/${r.id}`
                  }>
                    {r.selfRatingStatus !== 'submitted' ? 'Start' : r.supervisorRatingStatus === 'submitted' && !r.employeeAcknowledged ? 'Acknowledge' : 'View'}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
