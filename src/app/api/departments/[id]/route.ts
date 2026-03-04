import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { departments, employees } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and, count } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  headId: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
    }

    const [updated] = await db
      .update(departments)
      .set(parsed.data)
      .where(and(eq(departments.id, id), eq(departments.companyId, user.companyId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check employee count
    const [{ empCount }] = await db
      .select({ empCount: count(employees.id) })
      .from(employees)
      .where(and(eq(employees.departmentId, id), eq(employees.companyId, user.companyId)));

    if (Number(empCount) > 0) {
      return NextResponse.json(
        { error: `Cannot delete department with ${empCount} active employees.` },
        { status: 409 }
      );
    }

    await db
      .delete(departments)
      .where(and(eq(departments.id, id), eq(departments.companyId, user.companyId)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
