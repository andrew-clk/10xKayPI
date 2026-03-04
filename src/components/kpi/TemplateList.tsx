'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Copy, LayoutTemplate, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { KpiTemplate, KpiAngle } from '@/types';
import { ANGLE_LABELS, ANGLE_COLORS } from '@/utils/score';

const ANGLES: KpiAngle[] = ['commitment', 'contribution', 'character', 'competency'];

function AngleBar({ template }: { template: KpiTemplate }) {
  return (
    <div className="space-y-1.5">
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {ANGLES.map(a => {
          const key = `${a}Weight` as keyof KpiTemplate;
          const w = parseFloat(template[key] as string || '0');
          return w > 0 ? <div key={a} className={`${ANGLE_COLORS[a]}`} style={{ width: `${w}%` }} title={`${ANGLE_LABELS[a]}: ${w}%`} /> : null;
        })}
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {ANGLES.map(a => {
          const key = `${a}Weight` as keyof KpiTemplate;
          const w = parseFloat(template[key] as string || '0');
          return <div key={a} className="flex items-center gap-1 text-xs text-slate-500"><span className={`inline-block w-2 h-2 rounded-full ${ANGLE_COLORS[a]}`} /><span>{ANGLE_LABELS[a]}: {w}%</span></div>;
        })}
      </div>
    </div>
  );
}

export function TemplateList({ templates: initial }: { templates: KpiTemplate[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/kpi-templates/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      setTemplates(prev => prev.filter(t => t.id !== deleteId));
      setDeleteId(null);
      toast.success('Template deleted');
    } catch {
      toast.error('Failed to delete template');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(t: KpiTemplate) {
    try {
      const res = await fetch('/api/kpi-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${t.name} (Copy)`,
          positionType: t.positionType,
          description: t.description,
          isActive: false,
          commitmentWeight: t.commitmentWeight,
          contributionWeight: t.contributionWeight,
          characterWeight: t.characterWeight,
          competencyWeight: t.competencyWeight,
          criteria: (t.criteria ?? []).map(c => ({
            angle: c.angle, name: c.name, nameEn: c.nameEn, description: c.description,
            weight: c.weight, sortOrder: c.sortOrder, minScore: c.minScore, maxScore: c.maxScore,
            scoringGuide: c.scoringGuide, notes: c.notes, isRequired: c.isRequired,
          })),
        }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success('Template duplicated');
      router.refresh();
    } catch {
      toast.error('Failed to duplicate');
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        <Link href="/dashboard/kpi-templates/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2"><Plus className="h-4 w-4" />New Template</Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <LayoutTemplate className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-base font-semibold text-slate-700">No templates yet</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6">Create your first KPI template to start reviewing performance.</p>
          <Link href="/dashboard/kpi-templates/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2"><Plus className="h-4 w-4" />Create Template</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map(t => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">{t.name}</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">{t.positionType}</p>
                  </div>
                  {t.isActive
                    ? <Badge className="bg-green-100 text-green-800 border-green-200 text-xs flex-shrink-0"><CheckCircle className="h-3 w-3 mr-0.5" />Active</Badge>
                    : <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs flex-shrink-0"><XCircle className="h-3 w-3 mr-0.5" />Inactive</Badge>
                  }
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <AngleBar template={t} />
                <p className="text-xs text-slate-500">{(t.criteria ?? []).length} criteria</p>
                <div className="flex gap-1 pt-1 border-t border-slate-100">
                  <Link href={`/dashboard/kpi-templates/${t.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1"><Pencil className="h-3.5 w-3.5" />Edit</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(t)} title="Duplicate"><Copy className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(t.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Template</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Are you sure you want to delete <strong>{templates.find(t => t.id === deleteId)?.name}</strong>? This also deletes all criteria. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
