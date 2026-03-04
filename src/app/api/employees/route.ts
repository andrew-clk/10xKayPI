import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employees, departments } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and, or, ilike } from 'drizzle-orm';
import { z } from 'zod';

const createSchema = z.object({
  employeeId: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  position: z.string().min(1),
  departmentId: z.string().uuid().optional().nullable(),
  supervisorId: z.string().uuid().optional().nullable(),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  role: z.enum(['super_admin', 'manager', 'employee']).default('employee'),
  status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  photoUrl: z.string().url().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? '';

    const conditions = [eq(employees.companyId, user.companyId)];
    if (status && status !== 'all') {
      conditions.push(eq(employees.status, status as 'active' | 'inactive' | 'terminated'));
    }

    const rows = await db
      .select({
        id: employees.id,
        companyId: employees.companyId,
        employeeId: employees.employeeId,
        fullName: employees.fullName,
        email: employees.email,
        phone: employees.phone,
        photoUrl: employees.photoUrl,
        departmentId: employees.departmentId,
        position: employees.position,
        supervisorId: employees.supervisorId,
        joinDate: employees.joinDate,
        terminationDate: employees.terminationDate,
        status: employees.status,
        role: employees.role,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        departmentName: departments.name,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(and(...conditions));

    const filtered = search
      ? rows.filter(r =>
          r.fullName.toLowerCase().includes(search.toLowerCase()) ||
          r.email.toLowerCase().includes(search.toLowerCase()) ||
          r.employeeId.toLowerCase().includes(search.toLowerCase()) ||
          r.position.toLowerCase().includes(search.toLowerCase())
        )
      : rows;

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
    }

    const data = parsed.data;

    // Check duplicates
    const existing = await db
      .select({ id: employees.id, field: employees.email })
      .from(employees)
      .where(
        and(
          eq(employees.companyId, user.companyId),
          or(eq(employees.email, data.email), eq(employees.employeeId, data.employeeId))
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Employee ID or email already exists.' }, { status: 409 });
    }

    const [created] = await db
      .insert(employees)
      .values({
        ...data,
        companyId: user.companyId,
        departmentId: data.departmentId ?? null,
        supervisorId: data.supervisorId ?? null,
        phone: data.phone ?? null,
        photoUrl: data.photoUrl ?? null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
