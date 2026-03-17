'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ANGLE_LABELS, ANGLE_COLORS, calculateWeightedScore, getAngleWeight, getRatingVariance, VARIANCE_COLORS } from '@/utils/score';
import type { PerformanceReview, KpiCriterion, KpiAngle } from '@/types';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface Props {
  review: PerformanceReview;
}

type SupervisorRatingMap = Record<string, { rating: number | null; comments: string }>;

export function SupervisorRatingForm({ review }: Props) {
  const router = useRouter();
  const template = review.template!;
  const criteria = template.criteria ?? [];
  const existingRatings = review.ratings ?? [];

  const initialRatings = useMemo<SupervisorRatingMap>(() => {
    const map: SupervisorRatingMap = {};
    for (const c of criteria) {
      const ex = existingRatings.find(r => r.criterionId === c.id);
      map[c.id] = { rating: ex?.supervisorRating ?? null, comments: ex?.supervisorComments ?? '' };
    }
    return map;
  }, [criteria, existingRatings]);

  const [ratings, setRatings] = useState<SupervisorRatingMap>(initialRatings);
  const [strengths, setStrengths] = useState(review.strengths ?? '');
  const [improvementAreas, setImprovementAreas] = useState(review.improvementAreas ?? '');
  const [actionPlan, setActionPlan] = useState(review.actionPlan ?? '');
  const [supervisorComments, setSupervisorComments] = useState(review.supervisorComments ?? '');
  const [submitting, setSubmitting] = useState(false);

  const angles = ['commitment', 'contribution', 'character', 'competency'] as KpiAngle[];

  const criteriaByAngle = useMemo(() => {
    const map: Record<KpiAngle, KpiCriterion[]> = { commitment: [], contribution: [], character: [], competency: [] };
    for (const c of criteria) map[c.angle].push(c);
    return map;
  }, [criteria]);

  const liveScore = useMemo(() => {
    let weightedSum = 0;
    let totalWeight = 0;

    // Group criteria by angle to calculate properly
    const angles = ['commitment', 'contribution', 'character', 'competency'] as KpiAngle[];

    for (const angle of angles) {
      const angleCriteria = criteriaByAngle[angle];
      const angleWeight = getAngleWeight(template, angle);

      if (angleCriteria.length === 0) continue;

      let angleSum = 0;
      let angleCriteriaWeight = 0;

      for (const c of angleCriteria) {
        const r = ratings[c.id];
        if (r?.rating != null) {
          const criterionWeight = parseFloat(c.weight);
          angleSum += r.rating * criterionWeight;
          angleCriteriaWeight += criterionWeight;
        }
      }

      // If we have ratings for this angle, calculate the weighted score
      if (angleCriteriaWeight > 0) {
        const angleScore = angleSum / angleCriteriaWeight; // Average score for this angle
        weightedSum += angleScore * angleWeight;
        totalWeight += angleWeight;
      }
    }

    // Calculate final score as weighted average
    const finalScore = totalWeight > 0 ? (weightedSum / totalWeight) * 10 : 0;
    return Math.round(finalScore * 10) / 10; // Round to 1 decimal
  }, [ratings, criteria, template, criteriaByAngle]);

  const majorVariances = useMemo(() => {
    return criteria.filter(c => {
      const ex = existingRatings.find(r => r.criterionId === c.id);
      const selfRating = ex?.selfRating ?? null;
      const supRating = ratings[c.id]?.rating ?? null;
      return getRatingVariance(selfRating, supRating) === 'major';
    });
  }, [criteria, existingRatings, ratings]);

  function setRating(criterionId: string, val: number) {
    setRatings(prev => ({ ...prev, [criterionId]: { ...prev[criterionId], rating: val } }));
  }
  function setComments(criterionId: string, val: string) {
    setRatings(prev => ({ ...prev, [criterionId]: { ...prev[criterionId], comments: val } }));
  }

  async function handleSubmit() {
    const requiredCriteria = criteria.filter(c => c.isRequired);
    const allRated = requiredCriteria.every(c => ratings[c.id]?.rating != null);
    if (!allRated) { toast.error(`Please rate all ${requiredCriteria.length} required criteria`); return; }
    setSubmitting(true);
    try {
      const payload = {
        strengths: strengths || null,
        improvementAreas: improvementAreas || null,
        actionPlan: actionPlan || null,
        supervisorComments: supervisorComments || null,
        ratings: Object.entries(ratings).map(([criterionId, v]) => ({
          criterionId,
          supervisorRating: v.rating,
          supervisorComments: v.comments || null,
        })),
      };
      const res = await fetch(`/api/reviews/${review.id}/supervisor-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to save'); return; }
      toast.success('Supervisor rating submitted!');
      router.push('/dashboard/team-reviews');
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Score preview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 border rounded-lg p-4">
          <p className="text-sm text-slate-500">Employee Self Score</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {review.selfTotalScore ? parseFloat(review.selfTotalScore).toFixed(1) : '—'}
          </p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-700 font-medium">Your Rating Preview</p>
          <p className="text-2xl font-bold text-indigo-900 mt-1">{liveScore.toFixed(1)}<span className="text-sm font-normal text-indigo-600">/100</span></p>
        </div>
      </div>

      {majorVariances.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Major variance detected</strong> in {majorVariances.length} criterion: {majorVariances.map(c => c.name).join(', ')}.
            Consider adding comments to explain the difference.
          </AlertDescription>
        </Alert>
      )}

      <Accordion type="multiple" defaultValue={angles.filter(a => criteriaByAngle[a].length > 0)} className="space-y-3">
        {angles.map(angle => {
          const angleCriteria = criteriaByAngle[angle];
          if (angleCriteria.length === 0) return null;
          const angleWeight = getAngleWeight(template, angle);

          return (
            <AccordionItem key={angle} value={angle} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50">
                <div className="flex items-center gap-3 w-full mr-2">
                  <Badge className={`text-xs ${ANGLE_COLORS[angle]}`}>{ANGLE_LABELS[angle]}</Badge>
                  <span className="text-xs text-slate-500">{angleWeight}% weight</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <div className="divide-y">
                  {angleCriteria.map(c => {
                    const r = ratings[c.id] ?? { rating: null, comments: '' };
                    const existing = existingRatings.find(ex => ex.criterionId === c.id);
                    const selfRating = existing?.selfRating ?? null;
                    const variance = getRatingVariance(selfRating, r.rating);
                    const maxScore = c.maxScore ?? 10;
                    const minScore = c.minScore ?? 0;
                    const steps = Array.from({ length: maxScore - minScore + 1 }, (_, i) => minScore + i);

                    return (
                      <div key={c.id} className={`p-4 space-y-3 ${variance ? `border-l-4 ${VARIANCE_COLORS[variance].split(' ')[0]}` : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-slate-900">{c.name}</p>
                              {c.isRequired && <span className="text-red-500 text-xs">*</span>}
                              {variance === 'major' && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                              {variance === 'agree' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                            </div>
                            {c.nameEn && <p className="text-xs text-slate-500">{c.nameEn}</p>}
                          </div>
                          <div className="text-right shrink-0 text-xs text-slate-500">
                            {selfRating != null && <p>Employee: <span className="font-semibold text-slate-700">{selfRating}</span></p>}
                            {existing?.selfComments && <p className="italic mt-0.5 max-w-[160px] truncate">&ldquo;{existing.selfComments}&rdquo;</p>}
                          </div>
                        </div>

                        {c.scoringGuide && (
                          <div className="flex gap-1.5 text-xs text-slate-500 bg-slate-50 rounded p-2">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>{c.scoringGuide}</span>
                          </div>
                        )}

                        <div className="flex gap-1.5 flex-wrap">
                          {steps.map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setRating(c.id, val)}
                              className={`w-9 h-9 rounded text-sm font-semibold transition-colors border ${
                                r.rating === val
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : val === selfRating
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                              }`}
                              title={val === selfRating ? "Employee's self-rating" : undefined}
                            >
                              {val}
                            </button>
                          ))}
                        </div>

                        <Textarea
                          value={r.comments}
                          onChange={e => setComments(c.id, e.target.value)}
                          placeholder={variance === 'major' ? 'Please explain the variance...' : 'Comments (optional)...'}
                          rows={2}
                          className="text-sm resize-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Overall feedback */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Overall Feedback</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Strengths</label>
            <Textarea value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="Key strengths observed..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Areas for Improvement</label>
            <Textarea value={improvementAreas} onChange={e => setImprovementAreas(e.target.value)} placeholder="Areas to develop..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Action Plan</label>
            <Textarea value={actionPlan} onChange={e => setActionPlan(e.target.value)} placeholder="Specific actions and milestones..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Overall Comments</label>
            <Textarea value={supervisorComments} onChange={e => setSupervisorComments(e.target.value)} placeholder="Overall performance summary..." rows={3} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
          {submitting ? 'Submitting...' : 'Submit Supervisor Rating'}
        </Button>
      </div>
    </div>
  );
}
