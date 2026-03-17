import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { employees, performanceReviews, reviewPeriods, kpiTemplates, departments } from '@/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { MyTeamView } from '@/components/team/MyTeamView';
import type { Employee, KpiTemplate, Department } from '@/types';

export const metadata = { title: 'My Team' };

export default async function MyTeamPage() {
  const user = await requireAuth();

  // Redirect employees who don't have team members
  if (user.role === 'employee') {
    redirect('/dashboard');
  }

  // Get all direct reports
  const teamMembers = await db
    .select()
    .from(employees)
    .where(and(
      eq(employees.supervisorId, user.id),
      eq(employees.status, 'active')
    ))
    .orderBy(employees.fullName);

  if (teamMembers.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Team</h1>
          <p className="text-slate-500 mt-1">You don't have any team members assigned to you yet.</p>
        </div>
        <div className="text-center py-16 text-slate-400">
          <p>When employees are assigned to you as their supervisor, they will appear here.</p>
        </div>
      </div>
    );
  }

  // Get current review period
  const currentPeriod = await db
    .select()
    .from(reviewPeriods)
    .where(eq(reviewPeriods.companyId, user.companyId))
    .orderBy(desc(reviewPeriods.year), desc(reviewPeriods.month))
    .limit(1);

  // Get reviews for team members in current period
  let teamReviews: any[] = [];
  if (currentPeriod.length > 0) {
    teamReviews = await db
      .select({
        employeeId: performanceReviews.employeeId,
        reviewId: performanceReviews.id,
        selfRatingStatus: performanceReviews.selfRatingStatus,
        supervisorRatingStatus: performanceReviews.supervisorRatingStatus,
        finalScore: performanceReviews.finalScore,
        performanceGrade: performanceReviews.performanceGrade,
        employeeAcknowledged: performanceReviews.employeeAcknowledged,
      })
      .from(performanceReviews)
      .where(and(
        eq(performanceReviews.reviewPeriodId, currentPeriod[0].id),
        eq(performanceReviews.supervisorId, user.id)
      ));
  }

  // Get all KPI templates
  const allKpiTemplates = await db
    .select()
    .from(kpiTemplates)
    .where(and(
      eq(kpiTemplates.companyId, user.companyId),
      eq(kpiTemplates.isActive, true)
    ))
    .orderBy(kpiTemplates.name);

  // Get all departments
  const allDepartments = await db
    .select()
    .from(departments)
    .where(eq(departments.companyId, user.companyId));

  // Create review status map
  const reviewStatusMap = teamReviews.reduce((acc, review) => {
    acc[review.employeeId] = review;
    return acc;
  }, {} as Record<string, any>);

  return (
    <MyTeamView
      user={user}
      teamMembers={teamMembers as Employee[]}
      kpiTemplates={allKpiTemplates as KpiTemplate[]}
      departments={allDepartments as Department[]}
      reviewStatusMap={reviewStatusMap}
      currentPeriod={currentPeriod[0] || null}
    />
  );
}