import { requireRole } from '@/lib/auth';
import { db } from '@/db';
import { employees, departments } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { EmployeeList } from '@/components/employees/EmployeeList';
import type { Employee, Department } from '@/types';

export const metadata = { title: 'Employees' };

export default async function EmployeesPage() {
  const user = await requireRole(['super_admin', 'manager']);

  const [allEmployees, allDepartments] = await Promise.all([
    db.select().from(employees).where(eq(employees.companyId, user.companyId)).orderBy(asc(employees.fullName)),
    db.select().from(departments).where(eq(departments.companyId, user.companyId)).orderBy(asc(departments.name)),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
        <p className="text-slate-500 mt-1">Manage your team members and their details.</p>
      </div>
      <EmployeeList
        employees={allEmployees as Employee[]}
        departments={allDepartments as Department[]}
        currentUserId={user.id}
      />
    </div>
  );
}
