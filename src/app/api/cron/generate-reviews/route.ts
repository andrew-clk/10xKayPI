import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { companies, employees, kpiTemplates, reviewPeriods, performanceReviews, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendReviewOpenedEmail } from '@/lib/email';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const periodStart = startOfMonth(now);
  const periodEnd = endOfMonth(now);

  const allCompanies = await db
    .select()
    .from(companies)
    .where(and(
      eq(companies.subscriptionStatus, 'active')
    ));

  const results = { companies: 0, reviews: 0, errors: 0 };

  for (const company of allCompanies) {
    try {
      // Check if period already exists
      const existing = await db
        .select({ id: reviewPeriods.id })
        .from(reviewPeriods)
        .where(and(
          eq(reviewPeriods.companyId, company.id),
          eq(reviewPeriods.year, year),
          eq(reviewPeriods.month, month)
        ))
        .limit(1);

      if (existing.length > 0) continue;

      const reviewDueDate = addDays(periodEnd, company.reviewDueDays);
      const monthName = format(now, 'MMMM yyyy');

      const [period] = await db.insert(reviewPeriods).values({
        companyId: company.id,
        periodName: monthName,
        year,
        month,
        startDate: format(periodStart, 'yyyy-MM-dd'),
        endDate: format(periodEnd, 'yyyy-MM-dd'),
        reviewDueDate: format(reviewDueDate, 'yyyy-MM-dd'),
        status: 'open',
      }).returning();

      const activeEmployees = await db
        .select()
        .from(employees)
        .where(and(eq(employees.companyId, company.id), eq(employees.status, 'active')));

      const templates = await db
        .select()
        .from(kpiTemplates)
        .where(and(eq(kpiTemplates.companyId, company.id), eq(kpiTemplates.isActive, true)));

      for (const emp of activeEmployees) {
        // Use employee's assigned template first, then fallback to position matching
        let template = emp.kpiTemplateId ? templates.find(t => t.id === emp.kpiTemplateId) : null;
        if (!template) {
          template = templates.find(t => t.positionType === emp.position) ?? templates[0];
        }
        if (!template) continue;

        try {
          const [review] = await db.insert(performanceReviews).values({
            companyId: company.id,
            employeeId: emp.id,
            reviewPeriodId: period.id,
            templateId: template.id,
            supervisorId: emp.supervisorId ?? null,
            selfRatingStatus: 'not_started',
            supervisorRatingStatus: 'not_started',
          }).returning();

          await db.insert(notifications).values({
            companyId: company.id,
            userId: emp.id,
            type: 'review_opened',
            title: `${monthName} Review Open`,
            message: `Your ${monthName} performance review is now open. Self-rating due ${format(reviewDueDate, 'MMM d, yyyy')}.`,
            actionUrl: `/dashboard/reviews/${review.id}/self-rating`,
          });

          if (emp.email) {
            await sendReviewOpenedEmail(
              emp.email,
              emp.fullName,
              monthName,
              format(reviewDueDate, 'MMMM d, yyyy'),
              review.id
            ).catch(console.error);
          }

          results.reviews++;
        } catch (err) {
          console.error(`Failed to create review for employee ${emp.id}:`, err);
          results.errors++;
        }
      }

      results.companies++;
    } catch (err) {
      console.error(`Failed to process company ${company.id}:`, err);
      results.errors++;
    }
  }

  return NextResponse.json({ success: true, ...results });
}
