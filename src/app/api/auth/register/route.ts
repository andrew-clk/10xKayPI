import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { companies, employees } from '@/db/schema';
import { eq } from 'drizzle-orm';

const registerSchema = z.object({
  companyName: z.string().min(2).max(100),
  industry: z.string().min(1),
  timezone: z.string().min(1),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed.' },
      { status: 422 }
    );
  }

  const input = parsed.data;

  // Check if email already exists
  const [existing] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.email, input.email));

  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 409 }
    );
  }

  try {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const [newCompany] = await db
      .insert(companies)
      .values({
        name: input.companyName,
        industry: input.industry,
        timezone: input.timezone,
        billingEmail: input.email,
        trialEndsAt,
      })
      .returning({ id: companies.id });

    await db.insert(employees).values({
      companyId: newCompany.id,
      passwordHash,
      employeeId: 'EMP001',
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      position: 'Administrator',
      role: 'super_admin',
      joinDate: new Date().toISOString().split('T')[0],
    });

    return NextResponse.json(
      { success: true, message: 'Account created successfully.' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Failed to set up account.' }, { status: 500 });
  }
}
