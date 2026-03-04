import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { kpiTemplates, kpiCriteria } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
  angle: z.enum(['commitment', 'contribution', 'character', 'competency']).optional(),
  name: z.string().min(1).optional(),
  nameEn: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  weight: z.string().optional(),
  sortOrder: z.number().optional(),
  minScore: z.number().optional(),
  maxScore: z.number().optional(),
  scoringGuide: z.string().optional(),
  examples: z.record(z.string(), z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
  isRequired: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; criterionId: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, criterionId } = await params;

    const [template] = await db
      .select({ id: kpiTemplates.id })
      .from(kpiTemplates)
      .where(and(eq(kpiTemplates.id, id), eq(kpiTemplates.companyId, user.companyId)));

    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
    }

    const [updated] = await db
      .update(kpiCriteria)
      .set(parsed.data)
      .where(and(eq(kpiCriteria.id, criterionId), eq(kpiCriteria.templateId, id)))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Criterion not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; criterionId: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, criterionId } = await params;

    const [template] = await db
      .select({ id: kpiTemplates.id })
      .from(kpiTemplates)
      .where(and(eq(kpiTemplates.id, id), eq(kpiTemplates.companyId, user.companyId)));

    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    await db
      .delete(kpiCriteria)
      .where(and(eq(kpiCriteria.id, criterionId), eq(kpiCriteria.templateId, id)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
