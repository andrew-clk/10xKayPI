import { requireRole } from '@/lib/auth';
import { db } from '@/db';
import { departments, employees } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { DepartmentList } from '@/components/employees/DepartmentList';
import type { Department, Employee } from '@/types';

export const metadata = { title: 'Departments' };

export default async function DepartmentsPage() {
  const user = await requireRole(['super_admin', 'manager']);

  const [allDepts, allEmployees] = await Promise.all([
    db.select().from(departments).where(eq(departments.companyId, user.companyId)).orderBy(asc(departments.name)),
    db.select().from(employees).where(eq(employees.companyId, user.companyId)).orderBy(asc(employees.fullName)),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
        <p className="text-slate-500 mt-1">Organize your company into departments.</p>
      </div>
      <DepartmentList
        departments={allDepts as Department[]}
        employees={allEmployees as Employee[]}
      />
    </div>
  );
}
