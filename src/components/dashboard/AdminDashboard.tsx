'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GRADE_COLORS } from '@/utils/score';
import type { Employee, PerformanceGrade } from '@/types';
import { Users, ClipboardCheck, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Review {
  id: string;
  selfRatingStatus: string;
  supervisorRatingStatus: string;
  finalScore: string | null;
  performanceGrade: string | null;
  employeeAcknowledged: boolean;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  periodName: string;
  reviewDueDate: string;
  year: number;
  month: number;
}

interface Props {
  user: Employee;
  totalEmployees: number;
  totalReviews: number;
  completedReviews: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
  topPerformers: Review[];
  pendingRatings: Review[];
  recentReviews: Review[];
}

const GRADE_BAR_COLORS: Record<string, string> = {
  A: '#22c55e', B: '#3b82f6', C: '#eab308', D: '#f97316', E: '#ef4444',
};

export function AdminDashboard({
  user, totalEmployees, totalReviews, completedReviews, averageScore,
  gradeDistribution, topPerformers, pendingRatings, recentReviews,
}: Props) {
  const completionRate = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

  const gradeData = Object.entries(gradeDistribution)
    .filter(([, v]) => v > 0)
    .map(([grade, count]) => ({ grade, count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user.fullName.split(' ')[0]}
        </h1>
        <p className="text-slate-500 mt-1">Here's an overview of your team's performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Employees', value: totalEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Reviews Completed', value: `${completedReviews}/${totalReviews}`, icon: ClipboardCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Average Score', value: averageScore > 0 ? averageScore.toFixed(1) : '—', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Chart */}
        {gradeData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={gradeData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {gradeData.map(entry => (
                      <Cell key={entry.grade} fill={GRADE_BAR_COLORS[entry.grade] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Completion Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Review Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Overall Progress</span>
                <span className="font-semibold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2.5" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Completed Reviews</span><span className="font-medium text-green-700">{completedReviews}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pending Supervisor Rating</span><span className="font-medium text-yellow-700">{pendingRatings.length}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Reviews</span><span className="font-medium">{totalReviews}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Ratings */}
      {pendingRatings.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Action Required ({pendingRatings.length})
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
                <Link href="/dashboard/team-reviews">View All <ChevronRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRatings.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm text-slate-900">{r.employeeName}</p>
                  <p className="text-xs text-slate-500">{r.employeePosition} · {r.periodName}</p>
                </div>
                <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <Link href={`/dashboard/reviews/${r.id}/supervisor-rating`}>Rate Now</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400 w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900 truncate">{r.employeeName}</p>
                  <p className="text-xs text-slate-500">{r.employeePosition}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-slate-700">{parseFloat(r.finalScore!).toFixed(1)}</span>
                  {r.performanceGrade && (
                    <Badge className={`text-xs font-bold ${GRADE_COLORS[r.performanceGrade as PerformanceGrade]}`}>
                      {r.performanceGrade}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
