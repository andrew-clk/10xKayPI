import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { performanceReviews, reviewPeriods, employees, departments } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireAuth();
  const { companyId } = user;

  if (user.role === 'super_admin' || user.role === 'manager') {
    // Fetch team stats
    const [totalEmployeesRow] = await db
      .select({ count: count() })
      .from(employees)
      .where(and(eq(employees.companyId, companyId), eq(employees.status, 'active')));

    const whereReviews = user.role === 'super_admin'
      ? eq(performanceReviews.companyId, companyId)
      : eq(performanceReviews.supervisorId, user.id);

    const allReviews = await db
      .select({
        id: performanceReviews.id,
        selfRatingStatus: performanceReviews.selfRatingStatus,
        supervisorRatingStatus: performanceReviews.supervisorRatingStatus,
        finalScore: performanceReviews.finalScore,
        performanceGrade: performanceReviews.performanceGrade,
        employeeAcknowledged: performanceReviews.employeeAcknowledged,
        employeeId: performanceReviews.employeeId,
        employeeName: employees.fullName,
        employeePosition: employees.position,
        periodName: reviewPeriods.periodName,
        reviewDueDate: reviewPeriods.reviewDueDate,
        year: reviewPeriods.year,
        month: reviewPeriods.month,
      })
      .from(performanceReviews)
      .innerJoin(reviewPeriods, eq(performanceReviews.reviewPeriodId, reviewPeriods.id))
      .innerJoin(employees, eq(performanceReviews.employeeId, employees.id))
      .where(whereReviews)
      .orderBy(desc(reviewPeriods.year), desc(reviewPeriods.month));

    const allDepts = await db
      .select()
      .from(departments)
      .where(eq(departments.companyId, companyId));

    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    let scoreSum = 0, scoreCount = 0;
    for (const r of allReviews) {
      if (r.performanceGrade) gradeDistribution[r.performanceGrade] = (gradeDistribution[r.performanceGrade] ?? 0) + 1;
      if (r.finalScore) { scoreSum += parseFloat(r.finalScore); scoreCount++; }
    }

    const completedReviews = allReviews.filter(r => r.supervisorRatingStatus === 'submitted');
    const topPerformers = completedReviews
      .filter(r => r.finalScore)
      .sort((a, b) => parseFloat(b.finalScore!) - parseFloat(a.finalScore!))
      .slice(0, 5);

    return (
      <AdminDashboard
        user={user}
        totalEmployees={totalEmployeesRow?.count ?? 0}
        totalReviews={allReviews.length}
        completedReviews={completedReviews.length}
        averageScore={scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : 0}
        gradeDistribution={gradeDistribution}
        topPerformers={topPerformers}
        pendingRatings={allReviews.filter(r => r.selfRatingStatus === 'submitted' && r.supervisorRatingStatus !== 'submitted')}
        recentReviews={allReviews.slice(0, 10)}
      />
    );
  }

  // Employee dashboard
  const myReviews = await db
    .select({
      id: performanceReviews.id,
      selfRatingStatus: performanceReviews.selfRatingStatus,
      supervisorRatingStatus: performanceReviews.supervisorRatingStatus,
      selfTotalScore: performanceReviews.selfTotalScore,
      finalScore: performanceReviews.finalScore,
      performanceGrade: performanceReviews.performanceGrade,
      employeeAcknowledged: performanceReviews.employeeAcknowledged,
      periodName: reviewPeriods.periodName,
      reviewDueDate: reviewPeriods.reviewDueDate,
      year: reviewPeriods.year,
      month: reviewPeriods.month,
    })
    .from(performanceReviews)
    .innerJoin(reviewPeriods, eq(performanceReviews.reviewPeriodId, reviewPeriods.id))
    .where(eq(performanceReviews.employeeId, user.id))
    .orderBy(desc(reviewPeriods.year), desc(reviewPeriods.month));

  return <EmployeeDashboard user={user} reviews={myReviews} />;
}
