import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviewPeriods } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['open', 'closed']),
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
      .update(reviewPeriods)
      .set({ status: parsed.data.status })
      .where(and(eq(reviewPeriods.id, id), eq(reviewPeriods.companyId, user.companyId)))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Period not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
