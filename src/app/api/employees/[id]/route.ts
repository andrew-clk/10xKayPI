import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employees } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
  employeeId: z.string().min(1).optional(),
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  position: z.string().min(1).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  supervisorId: z.string().uuid().nullable().optional(),
  kpiTemplateId: z.string().uuid().nullable().optional(),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  terminationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  role: z.enum(['super_admin', 'manager', 'employee']).optional(),
  status: z.enum(['active', 'inactive', 'terminated']).optional(),
  photoUrl: z.string().url().nullable().optional(),
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
      .update(employees)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(employees.id, id), eq(employees.companyId, user.companyId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
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

    const [updated] = await db
      .update(employees)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(and(eq(employees.id, id), eq(employees.companyId, user.companyId)))
      .returning({ id: employees.id });

    if (!updated) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
