import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { kpiTemplates, kpiCriteria } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  positionType: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  commitmentWeight: z.string().optional(),
  contributionWeight: z.string().optional(),
  characterWeight: z.string().optional(),
  competencyWeight: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const [template] = await db
      .select()
      .from(kpiTemplates)
      .where(and(eq(kpiTemplates.id, id), eq(kpiTemplates.companyId, user.companyId)));

    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const criteria = await db
      .select()
      .from(kpiCriteria)
      .where(eq(kpiCriteria.templateId, id))
      .orderBy(asc(kpiCriteria.sortOrder));

    return NextResponse.json({ ...template, criteria });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

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
      .update(kpiTemplates)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(kpiTemplates.id, id), eq(kpiTemplates.companyId, user.companyId)))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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

    await db.delete(kpiTemplates)
      .where(and(eq(kpiTemplates.id, id), eq(kpiTemplates.companyId, user.companyId)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
