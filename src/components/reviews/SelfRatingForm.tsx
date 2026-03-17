'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ANGLE_LABELS, ANGLE_COLORS, calculateWeightedScore, getAngleWeight } from '@/utils/score';
import type { PerformanceReview, KpiCriterion, KpiAngle, KpiTemplate } from '@/types';
import { Info, Sparkles, TrendingUp, Target } from 'lucide-react';

interface Props {
  review: PerformanceReview;
}

type RatingMap = Record<string, { rating: number | null; comments: string }>;

export function SelfRatingForm({ review }: Props) {
  const router = useRouter();
  const template = review.template!;
  const criteria = template.criteria ?? [];
  const existingRatings = review.ratings ?? [];

  const initialRatings = useMemo<RatingMap>(() => {
    const map: RatingMap = {};
    for (const c of criteria) {
      const existing = existingRatings.find(r => r.criterionId === c.id);
      map[c.id] = { rating: existing?.selfRating ?? null, comments: existing?.selfComments ?? '' };
    }
    return map;
  }, [criteria, existingRatings]);

  const [ratings, setRatings] = useState<RatingMap>(initialRatings);
  const [notes, setNotes] = useState(review.selfRatingNotes ?? '');
  const [submitting, setSubmitting] = useState(false);

  const angles = ['commitment', 'contribution', 'character', 'competency'] as KpiAngle[];

  const criteriaByAngle = useMemo(() => {
    const map: Record<KpiAngle, KpiCriterion[]> = {
      commitment: [], contribution: [], character: [], competency: [],
    };
    for (const c of criteria) map[c.angle].push(c);
    return map;
  }, [criteria]);

  const liveScore = useMemo(() => {
    let weightedSum = 0;
    let totalWeight = 0;

    // Group criteria by angle to calculate properly
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
  }, [ratings, criteria, template, angles, criteriaByAngle]);

  const ratedCount = Object.values(ratings).filter(r => r.rating != null).length;
  const requiredCount = criteria.filter(c => c.isRequired).length;
  const requiredRated = criteria.filter(c => c.isRequired && ratings[c.id]?.rating != null).length;

  function setRating(criterionId: string, val: number) {
    setRatings(prev => ({ ...prev, [criterionId]: { ...prev[criterionId], rating: val } }));
  }
  function setComments(criterionId: string, val: string) {
    setRatings(prev => ({ ...prev, [criterionId]: { ...prev[criterionId], comments: val } }));
  }

  async function handleSubmit(isDraft = false) {
    if (!isDraft && requiredRated < requiredCount) {
      toast.error(`Please rate all ${requiredCount} required criteria`);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        isDraft,
        notes,
        ratings: Object.entries(ratings).map(([criterionId, v]) => ({
          criterionId,
          selfRating: v.rating,
          selfComments: v.comments || null,
        })),
      };
      const res = await fetch(`/api/reviews/${review.id}/self-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to save'); return; }
      toast.success(isDraft ? 'Draft saved' : 'Self-rating submitted!');
      if (!isDraft) router.push('/dashboard/reviews');
      else router.refresh();
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const progressPercent = criteria.length > 0 ? (ratedCount / criteria.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Enhanced score preview with gamification */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-indigo-700 font-semibold flex items-center gap-1">
                Live Score Preview <Sparkles className="h-3.5 w-3.5" />
              </p>
              <p className="text-xs text-indigo-600">{ratedCount} of {criteria.length} rated</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {liveScore.toFixed(1)}
            </p>
            <p className="text-xs text-indigo-600 font-medium">out of 100</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Progress value={progressPercent} className="h-2.5" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-indigo-700">
              {requiredRated}/{requiredCount} required {requiredRated === requiredCount && '✓'}
            </span>
            <span className="text-indigo-600 font-medium">
              {Math.round(progressPercent)}% complete {progressPercent === 100 && '🎉'}
            </span>
          </div>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={angles.filter(a => criteriaByAngle[a].length > 0)} className="space-y-3">
        {angles.map(angle => {
          const angleCriteria = criteriaByAngle[angle];
          if (angleCriteria.length === 0) return null;
          const angleWeight = getAngleWeight(template, angle);

          // Calculate average score for this angle
          let angleSum = 0;
          let angleWeightSum = 0;
          for (const c of angleCriteria) {
            const r = ratings[c.id];
            if (r?.rating != null) {
              const criterionWeight = parseFloat(c.weight);
              angleSum += r.rating * criterionWeight;
              angleWeightSum += criterionWeight;
            }
          }
          const angleScore = angleWeightSum > 0 ? angleSum / angleWeightSum : 0;

          const angleRatedCount = angleCriteria.filter(c => ratings[c.id]?.rating != null).length;
          const angleProgress = angleCriteria.length > 0 ? (angleRatedCount / angleCriteria.length) * 100 : 0;

          return (
            <AccordionItem key={angle} value={angle} className="border-2 rounded-lg overflow-hidden hover:border-indigo-300 transition-colors">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gradient-to-r hover:from-slate-50 hover:to-indigo-50 transition-colors">
                <div className="flex items-center gap-4 w-full mr-2">
                  <div className="flex-1 flex items-center gap-3">
                    <h3 className="text-lg md:text-xl font-bold text-slate-900">{ANGLE_LABELS[angle]}</h3>
                    <Badge className={`text-xs ${ANGLE_COLORS[angle]}`}>{angleWeight}% weight</Badge>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-slate-500">{angleRatedCount}/{angleCriteria.length}</span>
                    <div className="text-base md:text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {angleScore.toFixed(1)}/10
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <div className="divide-y">
                  {angleCriteria.map(c => {
                    const r = ratings[c.id] ?? { rating: null, comments: '' };
                    const maxScore = c.maxScore ?? 10;
                    const minScore = c.minScore ?? 0;
                    const steps = Array.from({ length: maxScore - minScore + 1 }, (_, i) => minScore + i);

                    return (
                      <div key={c.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-slate-900">{c.name}</p>
                              {c.isRequired && <span className="text-red-500 text-xs">*</span>}
                            </div>
                            {c.nameEn && <p className="text-xs text-slate-500">{c.nameEn}</p>}
                          </div>
                          {r.rating != null && (
                            <div className="text-right shrink-0">
                              <span className="text-lg font-bold text-indigo-600">{r.rating}</span>
                              <span className="text-xs text-slate-500">/{maxScore}</span>
                            </div>
                          )}
                        </div>

                        {c.scoringGuide && (
                          <div className="flex gap-1.5 text-xs text-slate-500 bg-slate-50 rounded p-2">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>{c.scoringGuide}</span>
                          </div>
                        )}

                        {/* Enhanced rating buttons with animations */}
                        <div className="flex gap-1.5 flex-wrap">
                          {steps.map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setRating(c.id, val)}
                              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all border-2 ${
                                r.rating === val
                                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-600 shadow-md scale-110'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 hover:scale-105 hover:shadow-sm'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>

                        {r.rating != null && (
                          <div className="space-y-1">
                            <Progress value={(r.rating / maxScore) * 100} className="h-2" />
                            <p className="text-xs text-indigo-600 font-medium text-right">
                              {Math.round((r.rating / maxScore) * 100)}% {r.rating === maxScore && '🌟'}
                            </p>
                          </div>
                        )}

                        <Textarea
                          value={r.comments}
                          onChange={e => setComments(c.id, e.target.value)}
                          placeholder="Comments (optional)..."
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

      {/* Overall notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Overall Notes</label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any additional notes or context for your self-rating..."
          rows={3}
        />
      </div>

      {/* Enhanced action buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="border-2 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          <Target className="h-4 w-4 mr-1.5" />
          Save Draft
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all gap-1.5"
        >
          {submitting ? (
            <>Submitting...</>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Submit Self-Rating
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
