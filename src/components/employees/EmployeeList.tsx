'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Plus, Upload, Download, MoreHorizontal, UserX, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmployeeForm } from './EmployeeForm';
import type { Employee, Department, KpiTemplate, EmployeeRole } from '@/types';
import { canManageUser, hasPermission } from '@/lib/rbac';

interface Props {
  employees: Employee[];
  departments: Department[];
  kpiTemplates: KpiTemplate[];
  currentUserId: string;
  userRole: EmployeeRole;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
  terminated: 'bg-red-100 text-red-800',
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  leader: 'Team Leader',
  employee: 'Employee',
};

export function EmployeeList({ employees: initial, departments, kpiTemplates, currentUserId, userRole }: Props) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initial);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const PER_PAGE = 10;

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = !search || [e.fullName, e.email, e.employeeId, e.position]
        .some(v => v.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchDept = deptFilter === 'all' || e.departmentId === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [employees, search, statusFilter, deptFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function handleDeactivate(id: string) {
    if (id === currentUserId) { toast.error("Can't deactivate yourself"); return; }
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: 'inactive' as const } : e));
      toast.success('Employee deactivated');
    } catch {
      toast.error('Failed to deactivate');
    }
  }

  function handleSuccess() {
    router.refresh();
  }

  function exportCSV() {
    const headers = ['Employee ID', 'Full Name', 'Email', 'Phone', 'Position', 'Department', 'Status', 'Role', 'Join Date'];
    const rows = filtered.map(e => [
      e.employeeId, e.fullName, e.email, e.phone ?? '', e.position,
      departments.find(d => d.id === e.departmentId)?.name ?? '',
      e.status, e.role, e.joinDate,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'employees.csv'; a.click();
  }

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, email, ID, position..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-1"><Download className="h-4 w-4" />Export</Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 gap-1"><Plus className="h-4 w-4" />Add</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-slate-500">
        <span>{filtered.length} employee{filtered.length !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span>{employees.filter(e => e.status === 'active').length} active</span>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Employee</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">No employees found</TableCell></TableRow>
            ) : paged.map(e => (
              <TableRow key={e.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={e.photoUrl ?? undefined} alt={e.fullName} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">{initials(e.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{e.fullName}</p>
                      <p className="text-xs text-slate-500">{e.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-slate-600">{e.employeeId}</TableCell>
                <TableCell className="text-sm">{e.position}</TableCell>
                <TableCell className="text-sm text-slate-500">{departments.find(d => d.id === e.departmentId)?.name ?? '—'}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{ROLE_LABELS[e.role] ?? e.role}</Badge></TableCell>
                <TableCell><Badge className={`text-xs capitalize ${STATUS_COLORS[e.status] ?? ''}`}>{e.status}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(e); setFormOpen(true); }}>
                        <Pencil className="h-4 w-4 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeactivate(e.id)} className="text-red-600 focus:text-red-600" disabled={e.id === currentUserId}>
                        <UserX className="h-4 w-4 mr-2" />Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {paged.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white border rounded-lg">No employees found</div>
        ) : paged.map(e => (
          <div key={e.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={e.photoUrl ?? undefined} alt={e.fullName} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">{initials(e.fullName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{e.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{e.email}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditing(e); setFormOpen(true); }}>
                    <Pencil className="h-4 w-4 mr-2" />Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDeactivate(e.id)} className="text-red-600 focus:text-red-600" disabled={e.id === currentUserId}>
                    <UserX className="h-4 w-4 mr-2" />Deactivate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">ID:</span>
                <span className="ml-1 font-mono text-slate-700">{e.employeeId}</span>
              </div>
              <div>
                <span className="text-slate-500">Role:</span>
                <Badge variant="outline" className="text-xs ml-1">{ROLE_LABELS[e.role] ?? e.role}</Badge>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Position:</span>
                <span className="ml-1 text-slate-700">{e.position}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Department:</span>
                <span className="ml-1 text-slate-700">{departments.find(d => d.id === e.departmentId)?.name ?? '—'}</span>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>
                <Badge className={`text-xs capitalize ml-1 ${STATUS_COLORS[e.status] ?? ''}`}>{e.status}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === pages}>Next</Button>
          </div>
        </div>
      )}

      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
        employees={employees}
        departments={departments}
        kpiTemplates={kpiTemplates}
        currentUserId={currentUserId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
