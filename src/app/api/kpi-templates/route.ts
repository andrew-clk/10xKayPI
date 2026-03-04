import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { kpiTemplates, kpiCriteria } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, inArray, asc } from 'drizzle-orm';
import { z } from 'zod';

const criterionSchema = z.object({
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

const createSchema = z.object({
  name: z.string().min(1),
  positionType: z.string().min(1),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  commitmentWeight: z.string(),
  contributionWeight: z.string(),
  characterWeight: z.string(),
  competencyWeight: z.string(),
  criteria: z.array(criterionSchema).optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();

    const templates = await db
      .select()
      .from(kpiTemplates)
      .where(eq(kpiTemplates.companyId, user.companyId))
      .orderBy(kpiTemplates.createdAt);

    if (templates.length === 0) return NextResponse.json([]);

    const criteria = await db
      .select()
      .from(kpiCriteria)
      .where(inArray(kpiCriteria.templateId, templates.map(t => t.id)))
      .orderBy(asc(kpiCriteria.sortOrder));

    const criteriaMap = criteria.reduce<Record<string, typeof kpiCriteria.$inferSelect[]>>(
      (acc, c) => { (acc[c.templateId] ??= []).push(c); return acc; }, {}
    );

    return NextResponse.json(templates.map(t => ({ ...t, criteria: criteriaMap[t.id] ?? [] })));
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

    const d = parsed.data;
    const sum = [d.commitmentWeight, d.contributionWeight, d.characterWeight, d.competencyWeight]
      .reduce((acc, w) => acc + parseFloat(w), 0);

    if (Math.abs(sum - 100) > 0.01) {
      return NextResponse.json({ error: `Angle weights must sum to 100% (currently ${sum.toFixed(2)}%)` }, { status: 400 });
    }

    const [template] = await db.insert(kpiTemplates).values({
      companyId: user.companyId,
      name: d.name,
      positionType: d.positionType,
      description: d.description ?? null,
      isActive: d.isActive,
      commitmentWeight: d.commitmentWeight,
      contributionWeight: d.contributionWeight,
      characterWeight: d.characterWeight,
      competencyWeight: d.competencyWeight,
    }).returning();

    const insertedCriteria = d.criteria && d.criteria.length > 0
      ? await db.insert(kpiCriteria).values(
          d.criteria.map((c, i) => ({
            templateId: template.id,
            angle: c.angle,
            name: c.name,
            nameEn: c.nameEn ?? null,
            description: c.description ?? null,
            weight: c.weight,
            sortOrder: c.sortOrder ?? i,
            minScore: c.minScore,
            maxScore: c.maxScore,
            scoringGuide: c.scoringGuide,
            examples: c.examples ?? null,
            notes: c.notes ?? null,
            isRequired: c.isRequired,
          }))
        ).returning()
      : [];

    return NextResponse.json({ ...template, criteria: insertedCriteria }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
