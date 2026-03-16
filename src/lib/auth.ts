import { auth } from '@/auth';
import { db } from '@/db';
import { employees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Employee, EmployeeRole } from '@/types';
import { redirect } from 'next/navigation';
import { hasPermission, type Permission } from '@/lib/rbac';

export async function getCurrentUser(): Promise<Employee | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, session.user.id));

  return (employee as Employee) ?? null;
}

export async function requireAuth(): Promise<Employee> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(allowedRoles: EmployeeRole[]): Promise<Employee> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) redirect('/dashboard');
  return user;
}

export async function requirePermission(permission: Permission): Promise<Employee> {
  const user = await requireAuth();
  if (!hasPermission(user.role, permission)) {
    redirect('/dashboard');
  }
  return user;
}

export async function checkPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return hasPermission(user.role, permission);
}
