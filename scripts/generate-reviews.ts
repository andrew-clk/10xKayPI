import 'dotenv/config';
import { db } from '../src/db';
import { reviewPeriods, performanceReviews, employees, kpiTemplates, notifications, companies } from '../src/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { format, parseISO } from 'date-fns';

async function generateReviews() {
  try {
    console.log('🎯 Starting review generation...');

    // Get the first company
    const [company] = await db.select().from(companies).limit(1);
    if (!company) {
      console.error('❌ No company found');
      return;
    }

    console.log(`📦 Using company: ${company.name}`);

    // Get the latest review period
    const [latestPeriod] = await db
      .select()
      .from(reviewPeriods)
      .where(eq(reviewPeriods.companyId, company.id))
      .orderBy(desc(reviewPeriods.year), desc(reviewPeriods.month))
      .limit(1);

    if (!latestPeriod) {
      console.log('⚠️ No review period found. Creating one for current month...');

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const periodName = format(now, 'MMMM yyyy');

      const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
      const endDate = format(new Date(year, month, 0), 'yyyy-MM-dd');
      const reviewDueDate = format(new Date(year, month, 7), 'yyyy-MM-dd');

      const [newPeriod] = await db.insert(reviewPeriods).values({
        companyId: company.id,
        periodName,
        year,
        month,
        startDate,
        endDate,
        reviewDueDate,
        status: 'open',
      }).returning();

      console.log(`✅ Created review period: ${periodName}`);
      await generateReviewsForPeriod(company.id, newPeriod);
    } else {
      console.log(`📅 Found period: ${latestPeriod.periodName}`);

      // Check if reviews already exist for this period
      const existingReviews = await db
        .select()
        .from(performanceReviews)
        .where(eq(performanceReviews.reviewPeriodId, latestPeriod.id))
        .limit(1);

      if (existingReviews.length > 0) {
        console.log('ℹ️ Reviews already exist for this period');

        // Count total reviews
        const allReviews = await db
          .select()
          .from(performanceReviews)
          .where(eq(performanceReviews.reviewPeriodId, latestPeriod.id));

        console.log(`📊 Total reviews: ${allReviews.length}`);

        const notStarted = allReviews.filter(r => r.selfRatingStatus === 'not_started').length;
        const inProgress = allReviews.filter(r => r.selfRatingStatus === 'in_progress').length;
        const submitted = allReviews.filter(r => r.selfRatingStatus === 'submitted').length;
        const completed = allReviews.filter(r => r.supervisorRatingStatus === 'submitted').length;

        console.log(`📈 Status breakdown:`);
        console.log(`   - Not Started: ${notStarted}`);
        console.log(`   - In Progress: ${inProgress}`);
        console.log(`   - Self-Rating Submitted: ${submitted}`);
        console.log(`   - Fully Completed: ${completed}`);
      } else {
        console.log('⚠️ No reviews found for this period. Generating now...');
        await generateReviewsForPeriod(company.id, latestPeriod);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

async function generateReviewsForPeriod(companyId: string, period: any) {
  console.log('🔄 Generating reviews for all active employees...');

  const activeEmployees = await db
    .select()
    .from(employees)
    .where(and(
      eq(employees.companyId, companyId),
      eq(employees.status, 'active')
    ));

  console.log(`👥 Found ${activeEmployees.length} active employees`);

  const templates = await db
    .select()
    .from(kpiTemplates)
    .where(and(
      eq(kpiTemplates.companyId, companyId),
      eq(kpiTemplates.isActive, true)
    ));

  console.log(`📋 Found ${templates.length} active KPI templates`);

  let reviewsCreated = 0;
  let notificationsCreated = 0;

  for (const emp of activeEmployees) {
    // Use employee's assigned template first, then fallback to position matching
    let template = emp.kpiTemplateId
      ? templates.find(t => t.id === emp.kpiTemplateId)
      : null;

    if (!template) {
      // Try to find template by position
      template = templates.find(t =>
        t.positionType.toLowerCase() === emp.position.toLowerCase() ||
        t.positionType.toLowerCase().includes(emp.position.toLowerCase()) ||
        emp.position.toLowerCase().includes(t.positionType.toLowerCase())
      );
    }

    if (!template && templates.length > 0) {
      // Use first available template as fallback
      template = templates[0];
      console.log(`⚠️ Using fallback template for ${emp.fullName} (${emp.position})`);
    }

    if (!template) {
      console.log(`❌ No template found for ${emp.fullName} (${emp.position})`);
      continue;
    }

    try {
      // Check if review already exists
      const existingReview = await db
        .select()
        .from(performanceReviews)
        .where(and(
          eq(performanceReviews.employeeId, emp.id),
          eq(performanceReviews.reviewPeriodId, period.id)
        ))
        .limit(1);

      if (existingReview.length > 0) {
        console.log(`   ℹ️ Review already exists for ${emp.fullName}`);
        continue;
      }

      const [review] = await db.insert(performanceReviews).values({
        companyId: companyId,
        employeeId: emp.id,
        reviewPeriodId: period.id,
        templateId: template.id,
        supervisorId: emp.supervisorId || null,
        selfRatingStatus: 'not_started',
        supervisorRatingStatus: 'not_started',
      }).returning();

      reviewsCreated++;
      console.log(`   ✅ Created review for ${emp.fullName} using template: ${template.name}`);

      // Create notification for the employee
      await db.insert(notifications).values({
        companyId: companyId,
        userId: emp.id,
        type: 'review_opened',
        title: `${period.periodName} Review Open`,
        message: `Your ${period.periodName} performance review is now open. Please complete your self-rating by ${format(parseISO(period.reviewDueDate), 'MMM d, yyyy')}.`,
        actionUrl: `/dashboard/reviews/${review.id}/self-rating`,
        isRead: false,
      });

      notificationsCreated++;

      // If employee has a supervisor, create notification for them too
      if (emp.supervisorId) {
        await db.insert(notifications).values({
          companyId: companyId,
          userId: emp.supervisorId,
          type: 'review_reminder',
          title: `Team Member Review Pending`,
          message: `${emp.fullName} has a pending review for ${period.periodName}. They need to complete their self-rating first.`,
          actionUrl: `/dashboard/team-reviews`,
          isRead: false,
        });
        notificationsCreated++;
      }

    } catch (error) {
      console.error(`   ❌ Failed to create review for ${emp.fullName}:`, error);
    }
  }

  console.log('\n🎉 Review generation completed!');
  console.log(`   📝 Reviews created: ${reviewsCreated}`);
  console.log(`   🔔 Notifications sent: ${notificationsCreated}`);

  if (reviewsCreated === 0) {
    console.log('\n⚠️ No new reviews were created. This might mean:');
    console.log('   1. All employees already have reviews for this period');
    console.log('   2. No active employees found');
    console.log('   3. No KPI templates available');
  }
}

generateReviews();