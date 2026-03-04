import { auth } from '@/auth';
import { db } from '@/db';
import { employees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Employee } from '@/types';
import { redirect } from 'next/navigation';

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

export async function requireRole(allowedRoles: Employee['role'][]): Promise<Employee> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) redirect('/dashboard');
  return user;
}
