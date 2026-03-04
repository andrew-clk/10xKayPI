import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await requireAuth();

    const rows = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.companyId, user.companyId)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
