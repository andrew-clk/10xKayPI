import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { kpiTemplates, kpiCriteria } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and, count } from 'drizzle-orm';
import { z } from 'zod';

const createSchema = z.object({
  angle: z.enum(['commitment', 'contribution', 'character', 'competency']),
  name: z.string().min(1),
  nameEn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  weight: z.string(),
  sortOrder: z.number().optional(),
  minScore: z.number().default(0),
  maxScore: z.number().default(10),
  scoringGuide: z.string().default(''),
  examples: z.record(z.string(), z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
  isRequired: z.boolean().default(true),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const [template] = await db
      .select({ id: kpiTemplates.id })
      .from(kpiTemplates)
      .where(and(eq(kpiTemplates.id, id), eq(kpiTemplates.companyId, user.companyId)));

    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
    }

    const d = parsed.data;
    const sortOrder = d.sortOrder ?? (await db
      .select({ n: count(kpiCriteria.id) })
      .from(kpiCriteria)
      .where(eq(kpiCriteria.templateId, id))
      .then(r => Number(r[0]?.n ?? 0)));

    const [created] = await db.insert(kpiCriteria).values({
      templateId: id,
      angle: d.angle,
      name: d.name,
      nameEn: d.nameEn ?? null,
      description: d.description ?? null,
      weight: d.weight,
      sortOrder,
      minScore: d.minScore,
      maxScore: d.maxScore,
      scoringGuide: d.scoringGuide,
      examples: d.examples ?? null,
      notes: d.notes ?? null,
      isRequired: d.isRequired,
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
