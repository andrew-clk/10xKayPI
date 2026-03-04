'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Department, Employee } from '@/types';

interface Props {
  departments: Department[];
  employees: Employee[];
}

interface FormState {
  name: string;
  description: string;
  headId: string;
  status: 'active' | 'inactive';
}

const defaultForm: FormState = { name: '', description: '', headId: 'none', status: 'active' };

export function DepartmentList({ departments: initial, employees }: Props) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setFormOpen(true);
  }

  function openEdit(dept: Department) {
    setEditingId(dept.id);
    setForm({
      name: dept.name,
      description: dept.description ?? '',
      headId: dept.headId ?? 'none',
      status: dept.status,
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Department name is required'); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description || null,
        headId: form.headId === 'none' ? null : form.headId,
        status: form.status,
      };
      const url = editingId ? `/api/departments/${editingId}` : '/api/departments';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to save'); return; }
      toast.success(editingId ? 'Department updated' : 'Department created');
      setFormOpen(false);
      router.refresh();
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to delete'); return; }
      setDepartments(prev => prev.filter(d => d.id !== id));
      setDeleteId(null);
      toast.success('Department deleted');
    } catch {
      toast.error('Network error');
    }
  }

  const activeEmployees = employees.filter(e => e.status === 'active');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 gap-1">
          <Plus className="h-4 w-4" />Add Department
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Department</TableHead>
              <TableHead>Department Head</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No departments yet
                </TableCell>
              </TableRow>
            ) : departments.map(dept => {
              const head = employees.find(e => e.id === dept.headId);
              const memberCount = employees.filter(e => e.departmentId === dept.id && e.status === 'active').length;
              return (
                <TableRow key={dept.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{dept.name}</p>
                      {dept.description && <p className="text-xs text-slate-500 mt-0.5">{dept.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{head?.fullName ?? '—'}</TableCell>
                  <TableCell className="text-sm text-slate-600">{memberCount}</TableCell>
                  <TableCell>
                    <Badge className={dept.status === 'active' ? 'bg-green-100 text-green-800 text-xs' : 'bg-slate-100 text-slate-600 text-xs'}>
                      {dept.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(dept)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => setDeleteId(dept.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Department' : 'Add Department'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Engineering" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Department Head</Label>
              <Select value={form.headId} onValueChange={v => setForm(p => ({ ...p, headId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select head..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activeEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as 'active' | 'inactive' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Department?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">This will remove the department. Employees in this department will be unassigned.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
