import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { departments, employees } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and, count } from 'drizzle-orm';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  headId: z.string().uuid().optional().nullable(),
  parentDepartmentId: z.string().uuid().optional().nullable(),
});

export async function GET() {
  try {
    const user = await requireAuth();

    const rows = await db
      .select({
        id: departments.id,
        companyId: departments.companyId,
        name: departments.name,
        description: departments.description,
        headId: departments.headId,
        parentDepartmentId: departments.parentDepartmentId,
        status: departments.status,
        createdAt: departments.createdAt,
        employeeCount: count(employees.id),
      })
      .from(departments)
      .leftJoin(
        employees,
        and(eq(employees.departmentId, departments.id), eq(employees.status, 'active'))
      )
      .where(eq(departments.companyId, user.companyId))
      .groupBy(departments.id)
      .orderBy(departments.name);

    return NextResponse.json(rows);
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

    const [created] = await db
      .insert(departments)
      .values({
        companyId: user.companyId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        headId: parsed.data.headId ?? null,
        parentDepartmentId: parsed.data.parentDepartmentId ?? null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('unique')) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
