import { requireRole } from '@/lib/auth';
import { db } from '@/db';
import { performanceReviews, reviewPeriods, employees, departments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ReportsView } from '@/components/reports/ReportsView';

export const metadata = { title: 'Reports' };

export default async function ReportsPage() {
  const user = await requireRole(['super_admin', 'manager']);

  const reviews = await db
    .select({
      id: performanceReviews.id,
      finalScore: performanceReviews.finalScore,
      performanceGrade: performanceReviews.performanceGrade,
      selfTotalScore: performanceReviews.selfTotalScore,
      supervisorTotalScore: performanceReviews.supervisorTotalScore,
      supervisorRatingStatus: performanceReviews.supervisorRatingStatus,
      employeeAcknowledged: performanceReviews.employeeAcknowledged,
      employeeId: performanceReviews.employeeId,
      employeeName: employees.fullName,
      employeePosition: employees.position,
      departmentId: employees.departmentId,
      periodName: reviewPeriods.periodName,
      year: reviewPeriods.year,
      month: reviewPeriods.month,
    })
    .from(performanceReviews)
    .innerJoin(reviewPeriods, eq(performanceReviews.reviewPeriodId, reviewPeriods.id))
    .innerJoin(employees, eq(performanceReviews.employeeId, employees.id))
    .where(eq(performanceReviews.companyId, user.companyId))
    .orderBy(desc(reviewPeriods.year), desc(reviewPeriods.month));

  const allDepts = await db
    .select()
    .from(departments)
    .where(eq(departments.companyId, user.companyId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 mt-1">Analyze performance data across your organization.</p>
      </div>
      <ReportsView reviews={reviews} departments={allDepts} />
    </div>
  );
}
