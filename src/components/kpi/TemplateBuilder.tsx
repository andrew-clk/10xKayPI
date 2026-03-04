'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, CheckCircle, AlertCircle, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { CriterionForm } from './CriterionForm';
import type { CriterionFormValues } from './CriterionForm';
import type { KpiTemplate, KpiCriterion, KpiAngle } from '@/types';
import { ANGLE_LABELS, ANGLE_COLORS } from '@/utils/score';

const ANGLES: KpiAngle[] = ['commitment', 'contribution', 'character', 'competency'];

const ANGLE_BG: Record<KpiAngle, string> = {
  commitment: 'bg-blue-50 border-blue-200',
  contribution: 'bg-purple-50 border-purple-200',
  character: 'bg-green-50 border-green-200',
  competency: 'bg-orange-50 border-orange-200',
};

interface TemplateBuilderProps {
  template?: KpiTemplate | null;
}

type LocalCriterion = KpiCriterion & { _tempId?: string };

export function TemplateBuilder({ template }: TemplateBuilderProps) {
  const router = useRouter();
  const isNew = !template?.id;

  const [name, setName] = useState(template?.name ?? '');
  const [positionType, setPositionType] = useState(template?.positionType ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [weights, setWeights] = useState({
    commitment: template?.commitmentWeight ?? '40',
    contribution: template?.contributionWeight ?? '40',
    character: template?.characterWeight ?? '10',
    competency: template?.competencyWeight ?? '10',
  });
  const [criteria, setCriteria] = useState<LocalCriterion[]>(
    (template?.criteria ?? []) as LocalCriterion[]
  );
  const [criterionOpen, setCriterionOpen] = useState(false);
  const [activeAngle, setActiveAngle] = useState<KpiAngle>('commitment');
  const [editingCriterion, setEditingCriterion] = useState<LocalCriterion | null>(null);
  const [saving, setSaving] = useState(false);

  const totalWeight = ANGLES.reduce((sum, a) => sum + parseFloat(weights[a] || '0'), 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  const getCriteriaForAngle = (angle: KpiAngle) =>
    criteria.filter(c => c.angle === angle).sort((a: LocalCriterion, b: LocalCriterion) => a.sortOrder - b.sortOrder);

  const handleAddCriterion = (angle: KpiAngle) => {
    setActiveAngle(angle);
    setEditingCriterion(null);
    setCriterionOpen(true);
  };

  const handleEditCriterion = (c: LocalCriterion) => {
    setActiveAngle(c.angle);
    setEditingCriterion(c);
    setCriterionOpen(true);
  };

  const handleDeleteCriterion = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id && c._tempId !== id));
  };

  const handleCriterionSave = useCallback((values: CriterionFormValues) => {
    if (editingCriterion) {
      setCriteria(prev => prev.map(c =>
        (c.id === editingCriterion.id || c._tempId === editingCriterion._tempId)
          ? { ...c, ...values }
          : c
      ));
    } else {
      const tempId = `temp-${Date.now()}`;
      const newCriterion: LocalCriterion = {
        id: tempId,
        _tempId: tempId,
        templateId: template?.id ?? '',
        angle: values.angle,
        name: values.name,
        nameEn: values.nameEn ?? null,
        description: values.description ?? null,
        weight: values.weight,
        sortOrder: getCriteriaForAngle(values.angle).length,
        minScore: values.minScore,
        maxScore: values.maxScore,
        scoringGuide: values.scoringGuide,
        examples: null,
        notes: values.notes ?? null,
        isRequired: values.isRequired,
        createdAt: new Date(),
      };
      setCriteria(prev => [...prev, newCriterion]);
    }
  }, [editingCriterion, template?.id]);

  async function handleSave() {
    if (!name.trim()) { toast.error('Template name is required'); return; }
    if (!positionType.trim()) { toast.error('Position type is required'); return; }
    if (!isWeightValid) { toast.error('Angle weights must sum to 100%'); return; }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        positionType: positionType.trim(),
        description: description || null,
        isActive,
        commitmentWeight: weights.commitment,
        contributionWeight: weights.contribution,
        characterWeight: weights.character,
        competencyWeight: weights.competency,
        criteria: criteria.map((c, i) => ({
          angle: c.angle,
          name: c.name,
          nameEn: c.nameEn,
          description: c.description,
          weight: c.weight,
          sortOrder: i,
          minScore: c.minScore,
          maxScore: c.maxScore,
          scoringGuide: c.scoringGuide,
          notes: c.notes,
          isRequired: c.isRequired,
        })),
      };

      const url = isNew ? '/api/kpi-templates' : `/api/kpi-templates/${template!.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!isNew && criteria.length > 0) {
        // Re-sync criteria for existing templates
        const existingIds = (template!.criteria ?? []).map(c => c.id);
        const newCriteria = criteria.filter(c => c._tempId);

        for (const c of newCriteria) {
          await fetch(`/api/kpi-templates/${template!.id}/criteria`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              angle: c.angle, name: c.name, nameEn: c.nameEn, description: c.description,
              weight: c.weight, sortOrder: c.sortOrder, minScore: c.minScore, maxScore: c.maxScore,
              scoringGuide: c.scoringGuide, notes: c.notes, isRequired: c.isRequired,
            }),
          });
        }
      }

      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to save'); return; }

      toast.success(isNew ? 'Template created!' : 'Template saved!');
      router.push('/dashboard/kpi-templates');
      router.refresh();
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Template Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Template Name <span className="text-red-500">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Installer Leader KPI" />
            </div>
            <div className="space-y-2">
              <Label>Position Type <span className="text-red-500">*</span></Label>
              <Input value={positionType} onChange={e => setPositionType(e.target.value)} placeholder="e.g. Installer Leader" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description..." />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="cursor-pointer">Active template</Label>
          </div>
        </CardContent>
      </Card>

      {/* Angle Weights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>4C Angle Weights</CardTitle>
            {isWeightValid
              ? <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> 100%</Badge>
              : <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="h-3 w-3 mr-1" /> {totalWeight.toFixed(1)}%</Badge>
            }
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {ANGLES.map(angle => (
              <div key={angle} className="space-y-2">
                <Label className="capitalize text-sm font-medium">{ANGLE_LABELS[angle]}</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={weights[angle]}
                    onChange={e => setWeights(prev => ({ ...prev, [angle]: e.target.value }))}
                    className="text-center"
                  />
                  <span className="text-slate-500 text-sm">%</span>
                </div>
              </div>
            ))}
          </div>
          {/* Weight bar */}
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {ANGLES.map(angle => {
              const w = parseFloat(weights[angle] || '0');
              return w > 0 ? (
                <div key={angle} className={`${ANGLE_COLORS[angle]} transition-all`} style={{ width: `${w}%` }} title={`${ANGLE_LABELS[angle]}: ${w}%`} />
              ) : null;
            })}
          </div>
          {!isWeightValid && <p className="text-red-600 text-sm mt-2">Weights must sum to exactly 100% (current: {totalWeight.toFixed(2)}%)</p>}
        </CardContent>
      </Card>

      {/* Criteria by Angle */}
      {ANGLES.map(angle => {
        const angleCriteria = getCriteriaForAngle(angle);
        const usedWeight = angleCriteria.reduce((sum, c) => sum + parseFloat(c.weight), 0);

        return (
          <Card key={angle} className={`border-2 ${ANGLE_BG[angle]}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base capitalize">{ANGLE_LABELS[angle]}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Weight: {weights[angle]}% of total | {angleCriteria.length} criteria ({usedWeight.toFixed(1)}% used)
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddCriterion(angle)}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {angleCriteria.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-2">No criteria yet. Click &quot;Add&quot; to add criteria for this angle.</p>
              ) : (
                <div className="space-y-2">
                  {angleCriteria.map((c: LocalCriterion) => (
                    <div key={c.id} className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-3">
                      <GripVertical className="h-4 w-4 text-slate-300 cursor-grab flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        {c.nameEn && <p className="text-xs text-slate-500 truncate">{c.nameEn}</p>}
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">{c.weight}%</Badge>
                      {c.isRequired && <Badge className="bg-slate-100 text-slate-600 text-xs flex-shrink-0 border-0">Required</Badge>}
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => handleEditCriterion(c)} className="h-7 w-7 p-0">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteCriterion(c.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Separator />

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || !isWeightValid}
          className="bg-indigo-600 hover:bg-indigo-700 px-8"
        >
          {saving ? 'Saving...' : isNew ? 'Create Template' : 'Save Changes'}
        </Button>
        <Button variant="outline" onClick={() => router.push('/dashboard/kpi-templates')}>
          Cancel
        </Button>
      </div>

      <CriterionForm
        open={criterionOpen}
        onOpenChange={setCriterionOpen}
        defaultAngle={activeAngle}
        criterion={editingCriterion}
        onSave={handleCriterionSave}
      />
    </div>
  );
}
