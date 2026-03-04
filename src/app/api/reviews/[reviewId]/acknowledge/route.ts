import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performanceReviews, notifications } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({
  employeeComments: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const user = await requireAuth();
    const { reviewId } = await params;

    const [review] = await db
      .select()
      .from(performanceReviews)
      .where(and(eq(performanceReviews.id, reviewId), eq(performanceReviews.companyId, user.companyId)));

    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    if (review.employeeId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (review.supervisorRatingStatus !== 'submitted') {
      return NextResponse.json({ error: 'Supervisor review not yet submitted' }, { status: 400 });
    }
    if (review.employeeAcknowledged) {
      return NextResponse.json({ error: 'Already acknowledged' }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    const comments = parsed.success ? (parsed.data.employeeComments ?? null) : null;

    await db.update(performanceReviews).set({
      employeeAcknowledged: true,
      employeeAcknowledgedAt: new Date(),
      employeeComments: comments,
      updatedAt: new Date(),
    }).where(eq(performanceReviews.id, reviewId));

    // Notify supervisor
    if (review.supervisorId) {
      await db.insert(notifications).values({
        companyId: user.companyId,
        userId: review.supervisorId,
        type: 'review_acknowledged',
        title: 'Review Acknowledged',
        message: `${user.fullName} has acknowledged their performance review.`,
        actionUrl: `/dashboard/reviews/${reviewId}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[acknowledge]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
