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
import { Info } from 'lucide-react';

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
    let total = 0;
    for (const c of criteria) {
      const r = ratings[c.id];
      if (r?.rating != null) {
        const angleWeight = getAngleWeight(template, c.angle);
        total += calculateWeightedScore(r.rating, parseFloat(c.weight), angleWeight);
      }
    }
    return Math.round(total * 100) / 100;
  }, [ratings, criteria, template]);

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

  return (
    <div className="space-y-6">
      {/* Score preview */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-700 font-medium">Live Score Preview</p>
          <p className="text-3xl font-bold text-indigo-900 mt-0.5">{liveScore.toFixed(1)}<span className="text-base font-normal text-indigo-600">/100</span></p>
        </div>
        <div className="text-right text-sm text-indigo-700">
          <p>{ratedCount} of {criteria.length} rated</p>
          <p>{requiredRated}/{requiredCount} required done</p>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={angles.filter(a => criteriaByAngle[a].length > 0)} className="space-y-3">
        {angles.map(angle => {
          const angleCriteria = criteriaByAngle[angle];
          if (angleCriteria.length === 0) return null;
          const angleWeight = getAngleWeight(template, angle);
          const angleScore = angleCriteria.reduce((sum, c) => {
            const r = ratings[c.id];
            if (r?.rating == null) return sum;
            return sum + calculateWeightedScore(r.rating, parseFloat(c.weight), angleWeight);
          }, 0);

          return (
            <AccordionItem key={angle} value={angle} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50">
                <div className="flex items-center gap-3 w-full mr-2">
                  <Badge className={`text-xs ${ANGLE_COLORS[angle]}`}>{ANGLE_LABELS[angle]}</Badge>
                  <span className="text-xs text-slate-500">{angleWeight}% weight</span>
                  <div className="ml-auto text-sm font-semibold text-slate-700">
                    {angleScore.toFixed(1)} pts
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

                        {/* Rating buttons */}
                        <div className="flex gap-1.5 flex-wrap">
                          {steps.map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setRating(c.id, val)}
                              className={`w-9 h-9 rounded text-sm font-semibold transition-colors border ${
                                r.rating === val
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>

                        {r.rating != null && (
                          <div>
                            <Progress value={(r.rating / maxScore) * 100} className="h-1.5" />
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

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => handleSubmit(true)} disabled={submitting}>
          Save Draft
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {submitting ? 'Submitting...' : 'Submit Self-Rating'}
        </Button>
      </div>
    </div>
  );
}
