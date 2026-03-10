'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GRADE_COLORS } from '@/utils/score';
import type { Employee, PerformanceGrade } from '@/types';
import { ClipboardList, TrendingUp, CheckCircle2, ChevronRight, Trophy, Star, Zap, Award, Target, Flame } from 'lucide-react';
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

  // Gamification: Achievements
  const gradeACount = completedReviews.filter(r => r.performanceGrade === 'A').length;
  const gradeBCount = completedReviews.filter(r => r.performanceGrade === 'B').length;
  const streak = completedReviews.length;
  const perfectScores = completedReviews.filter(r => parseFloat(r.finalScore!) >= 95).length;

  const achievements = [
    { id: 'first', icon: Star, name: 'First Review', desc: 'Complete your first review', unlocked: completedReviews.length >= 1, color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
    { id: 'streak3', icon: Flame, name: '3-Month Streak', desc: 'Complete 3 reviews in a row', unlocked: streak >= 3, color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { id: 'gradeA', icon: Trophy, name: 'Top Performer', desc: 'Achieve Grade A', unlocked: gradeACount >= 1, color: 'bg-green-50 text-green-600 border-green-200' },
    { id: 'perfect', icon: Zap, name: 'Excellence', desc: 'Score 95+ points', unlocked: perfectScores >= 1, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'consistent', icon: Target, name: 'Consistency', desc: 'Maintain 3 B+ grades', unlocked: (gradeACount + gradeBCount) >= 3, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'veteran', icon: Award, name: 'Veteran', desc: 'Complete 6 reviews', unlocked: completedReviews.length >= 6, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const achievementProgress = (unlockedCount / achievements.length) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {user.fullName.split(' ')[0]}
        </h1>
        <p className="text-slate-500 mt-1">{user.position}</p>
      </div>

      {/* Pending action with animation - moved to top */}
      {pendingAction && (
        <Card className="border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-lg animate-pulse">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-indigo-600 animate-bounce">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-indigo-900 flex items-center gap-1">
                  🎯 Action Required
                </p>
                <p className="text-sm text-indigo-700 mt-0.5">
                  {pendingAction.selfRatingStatus !== 'submitted'
                    ? `Complete your self-rating for ${pendingAction.periodName}`
                    : `Acknowledge your review for ${pendingAction.periodName}`
                  }
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 gap-1 shrink-0 shadow-md">
              <Link href={
                pendingAction.selfRatingStatus !== 'submitted'
                  ? `/dashboard/reviews/${pendingAction.id}/self-rating`
                  : `/dashboard/reviews/${pendingAction.id}/acknowledge`
              }>
                Start Now <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards with animation */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-2 border-indigo-200 hover:shadow-lg transition-all hover:scale-105">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{latestScore != null ? latestScore.toFixed(1) : '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">Latest Score</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 hover:shadow-lg transition-all hover:scale-105">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{completedReviews.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Reviews Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-200 hover:shadow-lg transition-all hover:scale-105">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{avgScore > 0 ? avgScore.toFixed(1) : '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">Average Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <div className="text-center py-8">
            <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No reviews yet. Reviews are generated monthly.</p>
            <p className="text-xs text-slate-400 mt-1">🚀 Your first review will unlock achievements!</p>
          </div>
        ) : reviews.slice(0, 5).map(r => (
          <Card key={r.id} className="hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900">{r.periodName}</p>
                    {r.performanceGrade && (
                      <Badge className={`text-xs font-bold shadow-sm ${GRADE_COLORS[r.performanceGrade as PerformanceGrade]}`}>
                        {r.performanceGrade === 'A' && '🏆 '}
                        {r.performanceGrade === 'B' && '⭐ '}
                        Grade {r.performanceGrade}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-slate-500">
                    <Badge className={`text-xs ${STATUS_COLORS[r.selfRatingStatus as keyof typeof STATUS_COLORS]}`}>
                      Self: {r.selfRatingStatus.replace('_', ' ')}
                    </Badge>
                    {r.finalScore && (
                      <span className="font-medium text-indigo-600">
                        Score: {parseFloat(r.finalScore).toFixed(1)} {parseFloat(r.finalScore) >= 90 && '🔥'}
                      </span>
                    )}
                  </div>
                </div>
                <Button asChild variant={r.selfRatingStatus !== 'submitted' ? 'default' : 'outline'} size="sm" className={`gap-1 shrink-0 ${r.selfRatingStatus !== 'submitted' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700' : ''}`}>
                  <Link href={
                    r.selfRatingStatus !== 'submitted'
                      ? `/dashboard/reviews/${r.id}/self-rating`
                      : r.supervisorRatingStatus === 'submitted' && !r.employeeAcknowledged
                      ? `/dashboard/reviews/${r.id}/acknowledge`
                      : `/dashboard/reviews/${r.id}`
                  }>
                    {r.selfRatingStatus !== 'submitted' ? '✨ Start' : r.supervisorRatingStatus === 'submitted' && !r.employeeAcknowledged ? '🎉 Acknowledge' : 'View'}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievements Section - moved to bottom */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-base">Achievements</CardTitle>
            </div>
            <Badge className="bg-yellow-500 text-white">{unlockedCount}/{achievements.length}</Badge>
          </div>
          <div className="mt-2">
            <Progress value={achievementProgress} className="h-2" />
            <p className="text-xs text-slate-500 mt-1">{Math.round(achievementProgress)}% Complete</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  achievement.unlocked
                    ? `${achievement.color} hover:shadow-md cursor-pointer`
                    : 'bg-slate-50 text-slate-300 border-slate-200 opacity-50'
                }`}
                title={achievement.desc}
              >
                <div className="flex flex-col items-center text-center">
                  <achievement.icon className={`h-6 w-6 mb-1 ${achievement.unlocked ? '' : 'text-slate-300'}`} />
                  <p className="text-xs font-semibold">{achievement.name}</p>
                </div>
                {achievement.unlocked && (
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
