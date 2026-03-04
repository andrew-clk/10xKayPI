'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { Plus, Calendar, Lock, Unlock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ReviewPeriod {
  id: string;
  periodName: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  reviewDueDate: string;
  status: 'open' | 'closed' | 'archived';
  reviewCount: number;
}

interface Props {
  initialPeriods: ReviewPeriod[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildDefaults(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const due = addDays(end, 7);
  return {
    periodName: format(date, 'MMMM yyyy'),
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    reviewDueDate: format(due, 'yyyy-MM-dd'),
  };
}

export function ReviewPeriodsView({ initialPeriods }: Props) {
  const [periods, setPeriods] = useState(initialPeriods);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [form, setForm] = useState(() => {
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    return { year: y, month: m, ...buildDefaults(y, m), generateReviews: true };
  });

  function handleMonthChange(year: number, month: number) {
    setForm(prev => ({ ...prev, year, month, ...buildDefaults(year, month) }));
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch('/api/review-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to create period'); return; }
      setPeriods(prev => [data, ...prev]);
      setCreating(false);
      toast.success(`Review period created${data.reviewsCreated ? ` · ${data.reviewsCreated} reviews generated` : ''}`);
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(period: ReviewPeriod) {
    const newStatus = period.status === 'open' ? 'closed' : 'open';
    const res = await fetch(`/api/review-periods/${period.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? 'Failed to update'); return; }
    setPeriods(prev => prev.map(p => p.id === period.id ? { ...p, status: newStatus } : p));
    toast.success(`Period ${newStatus === 'closed' ? 'closed' : 'reopened'}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Periods</h1>
          <p className="text-slate-500 mt-1">Manage monthly performance review cycles.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus className="h-4 w-4" /> New Period
        </Button>
      </div>

      {periods.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No review periods yet</p>
          <p className="text-sm mt-1">Create your first period to start collecting performance reviews.</p>
          <Button onClick={() => setCreating(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="h-4 w-4" /> Create First Period
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {periods.map(period => (
            <Card key={period.id} className={period.status === 'closed' ? 'opacity-75' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{period.periodName}</p>
                      <Badge className={period.status === 'open'
                        ? 'bg-green-100 text-green-800 border-0'
                        : 'bg-slate-100 text-slate-600 border-0'
                      }>
                        {period.status === 'open' ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                      <span>Period: {period.startDate} → {period.endDate}</span>
                      <span>Due: {period.reviewDueDate}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {period.reviewCount} reviews
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(period)}
                    className="gap-1.5 shrink-0"
                  >
                    {period.status === 'open'
                      ? <><Lock className="h-3.5 w-3.5" /> Close Period</>
                      : <><Unlock className="h-3.5 w-3.5" /> Reopen</>
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Review Period</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Month</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  value={form.month}
                  onChange={e => handleMonthChange(form.year, Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={e => handleMonthChange(Number(e.target.value), form.month)}
                  min={2020}
                  max={2100}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Period Name</Label>
              <Input
                value={form.periodName}
                onChange={e => setForm(prev => ({ ...prev, periodName: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Self-Rating Due Date</Label>
              <Input
                type="date"
                value={form.reviewDueDate}
                onChange={e => setForm(prev => ({ ...prev, reviewDueDate: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-900">Generate Reviews Now</p>
                <p className="text-xs text-slate-500 mt-0.5">Create reviews for all active employees and send notifications.</p>
              </div>
              <Switch
                checked={form.generateReviews}
                onCheckedChange={v => setForm(prev => ({ ...prev, generateReviews: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'Creating...' : 'Create Period'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
