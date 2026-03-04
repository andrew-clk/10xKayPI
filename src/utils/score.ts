import type { KpiAngle, KpiTemplate, KpiCriterion, PerformanceGrade } from '@/types';

export function getAngleWeight(template: KpiTemplate, angle: KpiAngle): number {
  const map: Record<KpiAngle, string> = {
    commitment: template.commitmentWeight,
    contribution: template.contributionWeight,
    character: template.characterWeight,
    competency: template.competencyWeight,
  };
  return parseFloat(map[angle] ?? '0');
}

export function calculateWeightedScore(
  rating: number,
  criterionWeight: number,
  angleWeight: number
): number {
  // Formula: rating × (criterion weight ÷ 100) × (angle weight ÷ 100) × 100
  return rating * (criterionWeight / 100) * (angleWeight / 100) * 100;
}

export function calculateTotalScore(
  ratings: { rating: number | null; criterionWeight: number; angleWeight: number }[]
): number {
  let total = 0;
  for (const r of ratings) {
    if (r.rating == null) continue;
    total += calculateWeightedScore(r.rating, r.criterionWeight, r.angleWeight);
  }
  return Math.round(total * 100) / 100;
}

export function getPerformanceGrade(score: number): PerformanceGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'E';
}

export function getRatingVariance(
  selfRating: number | null,
  supervisorRating: number | null
): 'agree' | 'minor' | 'major' | null {
  if (selfRating == null || supervisorRating == null) return null;
  const diff = Math.abs(selfRating - supervisorRating);
  if (diff <= 1) return 'agree';
  if (diff === 2) return 'minor';
  return 'major';
}

export const GRADE_COLORS: Record<PerformanceGrade, string> = {
  A: 'bg-green-100 text-green-800 border-green-200',
  B: 'bg-blue-100 text-blue-800 border-blue-200',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  D: 'bg-orange-100 text-orange-800 border-orange-200',
  E: 'bg-red-100 text-red-800 border-red-200',
};

export const VARIANCE_COLORS = {
  agree: 'bg-green-50 border-green-200',
  minor: 'bg-yellow-50 border-yellow-200',
  major: 'bg-red-50 border-red-200',
};

export const ANGLE_LABELS: Record<KpiAngle, string> = {
  commitment: 'Commitment',
  contribution: 'Contribution',
  character: 'Character',
  competency: 'Competency',
};

export const ANGLE_COLORS: Record<KpiAngle, string> = {
  commitment: 'text-blue-700 bg-blue-50 border-blue-200',
  contribution: 'text-purple-700 bg-purple-50 border-purple-200',
  character: 'text-green-700 bg-green-50 border-green-200',
  competency: 'text-orange-700 bg-orange-50 border-orange-200',
};
