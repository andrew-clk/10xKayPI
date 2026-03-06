'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GRADE_COLORS } from '@/utils/score';
import type { Employee, PerformanceGrade } from '@/types';
import { Users, ClipboardCheck, TrendingUp, AlertCircle, ChevronRight, Trophy, Star, Zap } from 'lucide-react';
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

      {/* Enhanced KPI Cards with gradients */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Employees', value: totalEmployees, icon: Users, gradient: 'from-blue-500 to-cyan-600' },
          { label: 'Reviews Completed', value: `${completedReviews}/${totalReviews}`, icon: ClipboardCheck, gradient: 'from-green-500 to-emerald-600' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, gradient: 'from-indigo-500 to-purple-600' },
          { label: 'Average Score', value: averageScore > 0 ? averageScore.toFixed(1) : '—', icon: TrendingUp, gradient: 'from-purple-500 to-pink-600' },
        ].map(({ label, value, icon: Icon, gradient }) => (
          <Card key={label} className="border-2 hover:shadow-lg transition-all hover:scale-105">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg bg-gradient-to-br ${gradient} shadow-md`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent">{value}</p>
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

      {/* Enhanced Pending Ratings */}
      {pendingRatings.length > 0 && (
        <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-yellow-500 animate-pulse">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                Action Required ({pendingRatings.length})
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs gap-1 hover:bg-yellow-100">
                <Link href="/dashboard/team-reviews">View All <ChevronRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRatings.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 px-3 border-b last:border-0 bg-white/50 rounded hover:bg-white/80 transition-colors">
                <div>
                  <p className="font-medium text-sm text-slate-900">{r.employeeName}</p>
                  <p className="text-xs text-slate-500">{r.employeePosition} · {r.periodName}</p>
                </div>
                <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md gap-1">
                  <Link href={`/dashboard/reviews/${r.id}/supervisor-rating`}>
                    <Zap className="h-3.5 w-3.5" />
                    Rate Now
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Top Performers */}
      {topPerformers.length > 0 && (
        <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Top Performers 🌟
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.map((r, i) => {
              const podiumIcons = [
                <div key="1" className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
                  <Trophy className="h-4 w-4 text-white" />
                </div>,
                <div key="2" className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-md">
                  <Star className="h-4 w-4 text-white" />
                </div>,
                <div key="3" className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
                  <Zap className="h-4 w-4 text-white" />
                </div>,
              ];
              return (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/70 hover:bg-white hover:shadow-sm transition-all">
                  {i < 3 ? podiumIcons[i] : <span className="text-sm font-bold text-slate-400 w-8 text-center">#{i + 1}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{r.employeeName}</p>
                    <p className="text-xs text-slate-500">{r.employeePosition}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{parseFloat(r.finalScore!).toFixed(1)}</span>
                    {r.performanceGrade && (
                      <Badge className={`text-xs font-bold shadow-sm ${GRADE_COLORS[r.performanceGrade as PerformanceGrade]}`}>
                        {r.performanceGrade === 'A' && '🏆 '}
                        {r.performanceGrade}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
