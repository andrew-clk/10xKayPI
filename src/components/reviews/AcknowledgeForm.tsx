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
import { CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{periodName}</h2>
          {performanceGrade && (
            <Badge className={`text-sm font-bold mt-1 ${GRADE_COLORS[performanceGrade as PerformanceGrade]}`}>
              Grade {performanceGrade} · {finalScore ? `${parseFloat(finalScore).toFixed(1)}/100` : ''}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {supervisorComments && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Supervisor Comments</CardTitle></CardHeader>
            <CardContent className="text-sm text-slate-700">{supervisorComments}</CardContent>
          </Card>
        )}
        {strengths && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-green-700">Strengths</CardTitle></CardHeader>
            <CardContent className="text-sm text-slate-700">{strengths}</CardContent>
          </Card>
        )}
        {improvementAreas && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-orange-700">Areas for Improvement</CardTitle></CardHeader>
            <CardContent className="text-sm text-slate-700">{improvementAreas}</CardContent>
          </Card>
        )}
        {actionPlan && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-700">Action Plan</CardTitle></CardHeader>
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

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        By acknowledging, you confirm that you have read and understood your performance review for this period.
      </div>

      <Button onClick={handleAcknowledge} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
        <CheckCircle2 className="h-4 w-4" />
        {submitting ? 'Acknowledging...' : 'Acknowledge Review'}
      </Button>
    </div>
  );
}
