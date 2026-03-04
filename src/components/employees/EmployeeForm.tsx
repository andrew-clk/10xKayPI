'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Employee, Department } from '@/types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  departmentId: z.string().uuid().optional().nullable(),
  supervisorId: z.string().uuid().optional().nullable(),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  role: z.enum(['super_admin', 'manager', 'employee']),
  status: z.enum(['active', 'inactive', 'terminated']),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  employees: Employee[];
  departments: Department[];
  currentUserId: string;
  onSuccess: () => void;
}

export function EmployeeForm({ open, onOpenChange, employee, employees, departments, currentUserId, onSuccess }: Props) {
  const isEditing = !!employee;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: '',
      fullName: '',
      email: '',
      phone: '',
      position: '',
      departmentId: null,
      supervisorId: null,
      joinDate: new Date().toISOString().split('T')[0],
      role: 'employee',
      status: 'active',
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email,
        phone: employee.phone ?? '',
        position: employee.position,
        departmentId: employee.departmentId ?? null,
        supervisorId: employee.supervisorId ?? null,
        joinDate: employee.joinDate,
        role: employee.role,
        status: employee.status,
      });
    } else {
      form.reset({
        employeeId: '', fullName: '', email: '', phone: '', position: '',
        departmentId: null, supervisorId: null,
        joinDate: new Date().toISOString().split('T')[0],
        role: 'employee', status: 'active',
      });
    }
  }, [employee, open, form]);

  async function onSubmit(values: FormValues) {
    try {
      const url = isEditing ? `/api/employees/${employee!.id}` : '/api/employees';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          phone: values.phone || null,
          departmentId: values.departmentId || null,
          supervisorId: values.supervisorId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to save'); return; }

      toast.success(isEditing ? 'Employee updated' : 'Employee added');
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error('Network error');
    }
  }

  const supervisorOptions = employees.filter(e => e.id !== (employee?.id ?? currentUserId) && e.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="employeeId" render={({ field }) => (
                <FormItem><FormLabel>Employee ID</FormLabel><FormControl><Input placeholder="EMP001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="joinDate" render={({ field }) => (
                <FormItem><FormLabel>Join Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Smith" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john@company.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="+60123456789" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="position" render={({ field }) => (
                <FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="Installer Leader" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="departmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={v => field.onChange(v === 'none' ? null : v)} value={field.value ?? 'none'}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="supervisorId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supervisor</FormLabel>
                  <Select onValueChange={v => field.onChange(v === 'none' ? null : v)} value={field.value ?? 'none'}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {supervisorOptions.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {isEditing ? 'Save Changes' : 'Add Employee'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
