import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employees, departments } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const rowSchema = z.object({
  employeeId: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  position: z.string().min(1),
  departmentName: z.string().optional().nullable(),
  supervisorEmail: z.string().email().optional().nullable(),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  role: z.enum(['super_admin', 'manager', 'employee']).default('employee'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const rows: unknown[] = Array.isArray(body) ? body : body.rows ?? [];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }
    if (rows.length > 500) {
      return NextResponse.json({ error: 'Max 500 rows per import' }, { status: 400 });
    }

    // Pre-fetch departments and employees for lookup
    const deptRows = await db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(eq(departments.companyId, user.companyId));

    const empRows = await db
      .select({ id: employees.id, email: employees.email, employeeId: employees.employeeId })
      .from(employees)
      .where(eq(employees.companyId, user.companyId));

    const deptMap = new Map(deptRows.map(d => [d.name.toLowerCase(), d.id]));
    const emailSet = new Set(empRows.map(e => e.email.toLowerCase()));
    const empIdSet = new Set(empRows.map(e => e.employeeId.toLowerCase()));
    const supervisorMap = new Map(empRows.map(e => [e.email.toLowerCase(), e.id]));

    const results: { row: number; success: boolean; error?: string }[] = [];
    const toInsert: (typeof employees.$inferInsert)[] = [];

    for (let i = 0; i < rows.length; i++) {
      const parsed = rowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        results.push({ row: i + 1, success: false, error: parsed.error.issues[0]?.message });
        continue;
      }

      const d = parsed.data;

      if (emailSet.has(d.email.toLowerCase())) {
        results.push({ row: i + 1, success: false, error: `Email ${d.email} already exists` });
        continue;
      }
      if (empIdSet.has(d.employeeId.toLowerCase())) {
        results.push({ row: i + 1, success: false, error: `Employee ID ${d.employeeId} already exists` });
        continue;
      }

      emailSet.add(d.email.toLowerCase());
      empIdSet.add(d.employeeId.toLowerCase());

      const deptId = d.departmentName ? (deptMap.get(d.departmentName.toLowerCase()) ?? null) : null;
      const supId = d.supervisorEmail ? (supervisorMap.get(d.supervisorEmail.toLowerCase()) ?? null) : null;

      toInsert.push({
        companyId: user.companyId,
        employeeId: d.employeeId,
        fullName: d.fullName,
        email: d.email,
        phone: d.phone ?? null,
        position: d.position,
        departmentId: deptId,
        supervisorId: supId,
        joinDate: d.joinDate,
        role: d.role,
        status: 'active',
      });
      results.push({ row: i + 1, success: true });
    }

    if (toInsert.length > 0) {
      await db.insert(employees).values(toInsert);
    }

    const successCount = results.filter(r => r.success).length;
    return NextResponse.json({
      results,
      summary: { total: rows.length, success: successCount, failed: rows.length - successCount },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
