'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GRADE_COLORS } from '@/utils/score';
import type { PerformanceGrade } from '@/types';
import { CheckCircle2, Trophy, Star, Award, Sparkles, PartyPopper } from 'lucide-react';

interface Props {
  reviewId: string;
  periodName: string;
  finalScore: string | null;
  performanceGrade: string | null;
  strengths: string | null;
  improvementAreas: string | null;
  actionPlan: string | null;
  supervisorComments: string | null;
}

export function AcknowledgeForm({
  reviewId, periodName, finalScore, performanceGrade,
  strengths, improvementAreas, actionPlan, supervisorComments,
}: Props) {
  const router = useRouter();
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleAcknowledge() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeComments: comments || null }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed'); return; }
      toast.success('Review acknowledged!');
      router.push('/dashboard/reviews');
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const score = finalScore ? parseFloat(finalScore) : 0;
  const isExcellent = score >= 90;
  const isGreat = score >= 80 && score < 90;
  const isGood = score >= 70 && score < 80;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Celebration header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-lg p-6 shadow-lg">
        <div className="absolute top-0 right-0 opacity-10">
          {isExcellent && <Trophy className="h-32 w-32 text-yellow-500" />}
          {isGreat && <Star className="h-32 w-32 text-indigo-500" />}
          {isGood && <Award className="h-32 w-32 text-blue-500" />}
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <PartyPopper className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Your Review is Ready!</h2>
          </div>
          <p className="text-sm text-slate-600 mb-3">{periodName}</p>
          {performanceGrade && finalScore && (
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`text-lg font-bold px-4 py-1.5 shadow-md ${GRADE_COLORS[performanceGrade as PerformanceGrade]}`}>
                {performanceGrade === 'A' && '🏆 '}
                {performanceGrade === 'B' && '⭐ '}
                {performanceGrade === 'C' && '👍 '}
                Grade {performanceGrade}
              </Badge>
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {parseFloat(finalScore).toFixed(1)}<span className="text-xl text-slate-500">/100</span>
              </div>
            </div>
          )}
          {isExcellent && (
            <p className="mt-3 text-sm font-semibold text-green-700 flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Outstanding performance! Keep up the excellent work! 🌟
            </p>
          )}
          {isGreat && (
            <p className="mt-3 text-sm font-semibold text-indigo-700 flex items-center gap-1">
              <Star className="h-4 w-4" />
              Great job! You're doing really well! 💪
            </p>
          )}
          {isGood && (
            <p className="mt-3 text-sm font-semibold text-blue-700 flex items-center gap-1">
              <Award className="h-4 w-4" />
              Good work! Keep pushing forward! 🚀
            </p>
          )}
        </div>
      </div>

      {/* Enhanced feedback cards with animations */}
      <div className="space-y-4">
        {supervisorComments && (
          <Card className="border-2 hover:border-indigo-300 hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                💬 Supervisor Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">{supervisorComments}</CardContent>
          </Card>
        )}
        {strengths && (
          <Card className="border-2 border-green-200 bg-green-50/30 hover:border-green-300 hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700 flex items-center gap-1.5">
                ✨ Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">{strengths}</CardContent>
          </Card>
        )}
        {improvementAreas && (
          <Card className="border-2 border-orange-200 bg-orange-50/30 hover:border-orange-300 hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-700 flex items-center gap-1.5">
                📈 Growth Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">{improvementAreas}</CardContent>
          </Card>
        )}
        {actionPlan && (
          <Card className="border-2 border-blue-200 bg-blue-50/30 hover:border-blue-300 hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700 flex items-center gap-1.5">
                🎯 Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">{actionPlan}</CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Your Comments (Optional)</label>
        <Textarea
          value={comments}
          onChange={e => setComments(e.target.value)}
          placeholder="Any comments or feedback on this review..."
          rows={3}
        />
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4 text-sm text-amber-800 shadow-sm">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
          <p>By acknowledging, you confirm that you have read and understood your performance review for this period.</p>
        </div>
      </div>

      <Button
        onClick={handleAcknowledge}
        disabled={submitting}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all gap-2 text-base px-6 py-5"
      >
        {submitting ? (
          <>Acknowledging...</>
        ) : (
          <>
            <PartyPopper className="h-5 w-5" />
            Acknowledge Review
          </>
        )}
      </Button>
    </div>
  );
}
