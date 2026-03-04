'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { GRADE_COLORS } from '@/utils/score';
import type { PerformanceGrade } from '@/types';
import { Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

interface Review {
  id: string;
  finalScore: string | null;
  performanceGrade: string | null;
  selfTotalScore: string | null;
  supervisorTotalScore: string | null;
  supervisorRatingStatus: string;
  employeeAcknowledged: boolean;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  departmentId: string | null;
  periodName: string;
  year: number;
  month: number;
}

interface Department { id: string; name: string }

interface Props {
  reviews: Review[];
  departments: Department[];
}

const GRADE_BAR_COLORS: Record<string, string> = { A: '#22c55e', B: '#3b82f6', C: '#eab308', D: '#f97316', E: '#ef4444' };

export function ReportsView({ reviews, departments }: Props) {
  const [periodFilter, setPeriodFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const periods = useMemo(() => {
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];
    for (const r of reviews) {
      const key = `${r.year}-${r.month}`;
      if (!seen.has(key)) { seen.add(key); result.push({ value: key, label: r.periodName }); }
    }
    return result;
  }, [reviews]);

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      const matchPeriod = periodFilter === 'all' || `${r.year}-${r.month}` === periodFilter;
      const matchDept = deptFilter === 'all' || r.departmentId === deptFilter;
      return matchPeriod && matchDept && r.supervisorRatingStatus === 'submitted';
    });
  }, [reviews, periodFilter, deptFilter]);

  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const r of filtered) if (r.performanceGrade) dist[r.performanceGrade]++;
    return Object.entries(dist).map(([grade, count]) => ({ grade, count }));
  }, [filtered]);

  const trendData = useMemo(() => {
    const byPeriod: Record<string, { sum: number; count: number; label: string }> = {};
    for (const r of reviews.filter(r2 => r2.supervisorRatingStatus === 'submitted' && r2.finalScore)) {
      const key = `${r.year}-${r.month}`;
      if (!byPeriod[key]) byPeriod[key] = { sum: 0, count: 0, label: r.periodName };
      byPeriod[key].sum += parseFloat(r.finalScore!);
      byPeriod[key].count++;
    }
    return Object.entries(byPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ period: v.label.replace(/\s+\d{4}$/, ''), avg: Math.round((v.sum / v.count) * 10) / 10 }));
  }, [reviews]);

  const deptAverages = useMemo(() => {
    const byDept: Record<string, { sum: number; count: number; name: string }> = {};
    for (const r of filtered) {
      if (!r.departmentId || !r.finalScore) continue;
      const deptName = departments.find(d => d.id === r.departmentId)?.name ?? 'Unknown';
      if (!byDept[r.departmentId]) byDept[r.departmentId] = { sum: 0, count: 0, name: deptName };
      byDept[r.departmentId].sum += parseFloat(r.finalScore!);
      byDept[r.departmentId].count++;
    }
    return Object.values(byDept)
      .map(v => ({ dept: v.name, avg: Math.round((v.sum / v.count) * 10) / 10 }))
      .sort((a, b) => b.avg - a.avg);
  }, [filtered, departments]);

  function exportCSV() {
    const headers = ['Employee', 'Position', 'Department', 'Period', 'Self Score', 'Supervisor Score', 'Final Score', 'Grade', 'Acknowledged'];
    const rows = filtered.map(r => [
      r.employeeName, r.employeePosition,
      departments.find(d => d.id === r.departmentId)?.name ?? '',
      r.periodName,
      r.selfTotalScore ? parseFloat(r.selfTotalScore).toFixed(1) : '',
      r.supervisorTotalScore ? parseFloat(r.supervisorTotalScore).toFixed(1) : '',
      r.finalScore ? parseFloat(r.finalScore).toFixed(1) : '',
      r.performanceGrade ?? '',
      r.employeeAcknowledged ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'performance-report.csv'; a.click();
  }

  const avgScore = filtered.length > 0
    ? filtered.reduce((s, r) => s + (r.finalScore ? parseFloat(r.finalScore) : 0), 0) / filtered.filter(r => r.finalScore).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Periods" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            {periods.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV} className="gap-1 ml-auto">
          <Download className="h-4 w-4" />Export CSV
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Reviews Analyzed', value: filtered.length },
          { label: 'Average Score', value: avgScore > 0 ? avgScore.toFixed(1) : '—' },
          { label: 'Grade A', value: filtered.filter(r => r.performanceGrade === 'A').length },
          { label: 'Acknowledged', value: filtered.filter(r => r.employeeAcknowledged).length },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Grade Distribution</CardTitle></CardHeader>
          <CardContent>
            {gradeDistribution.every(g => g.count === 0) ? (
              <p className="text-sm text-slate-400 py-8 text-center">No completed reviews</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gradeDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {gradeDistribution.map(entry => (
                      <Cell key={entry.grade} fill={GRADE_BAR_COLORS[entry.grade] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Score Trend */}
        {trendData.length > 1 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Average Score Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} name="Avg Score" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Department Averages */}
      {deptAverages.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Department Averages</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deptAverages.map(d => (
                <div key={d.dept} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-32 truncate">{d.dept}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${d.avg}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-10 text-right">{d.avg}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top performers table */}
      {filtered.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Individual Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500 text-xs">
                    <th className="pb-2">Employee</th>
                    <th className="pb-2">Period</th>
                    <th className="pb-2 text-center">Self</th>
                    <th className="pb-2 text-center">Supervisor</th>
                    <th className="pb-2 text-center">Final</th>
                    <th className="pb-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.slice(0, 20).map(r => (
                    <tr key={r.id}>
                      <td className="py-2">
                        <p className="font-medium text-slate-900">{r.employeeName}</p>
                        <p className="text-xs text-slate-400">{r.employeePosition}</p>
                      </td>
                      <td className="py-2 text-slate-600">{r.periodName}</td>
                      <td className="py-2 text-center text-slate-600">{r.selfTotalScore ? parseFloat(r.selfTotalScore).toFixed(1) : '—'}</td>
                      <td className="py-2 text-center text-slate-600">{r.supervisorTotalScore ? parseFloat(r.supervisorTotalScore).toFixed(1) : '—'}</td>
                      <td className="py-2 text-center font-semibold text-slate-900">{r.finalScore ? parseFloat(r.finalScore).toFixed(1) : '—'}</td>
                      <td className="py-2 text-center">
                        {r.performanceGrade && (
                          <Badge className={`text-xs font-bold ${GRADE_COLORS[r.performanceGrade as PerformanceGrade]}`}>
                            {r.performanceGrade}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
