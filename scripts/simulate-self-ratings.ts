import 'dotenv/config';
import { db } from '../src/db';
import { performanceReviews, reviewPeriods, employees, kpiCriteria, performanceRatings } from '../src/db/schema';
import { eq, and, desc } from 'drizzle-orm';

async function simulateSelfRatings() {
  try {
    console.log('🎯 Starting self-rating simulation...');

    // Get the latest review period
    const [latestPeriod] = await db
      .select()
      .from(reviewPeriods)
      .where(eq(reviewPeriods.status, 'open'))
      .orderBy(desc(reviewPeriods.year), desc(reviewPeriods.month))
      .limit(1);

    if (!latestPeriod) {
      console.error('❌ No open review period found');
      return;
    }

    console.log(`📅 Using period: ${latestPeriod.periodName}`);

    // Get some reviews that are not started
    const notStartedReviews = await db
      .select({
        review: performanceReviews,
        employee: employees,
      })
      .from(performanceReviews)
      .innerJoin(employees, eq(performanceReviews.employeeId, employees.id))
      .where(and(
        eq(performanceReviews.reviewPeriodId, latestPeriod.id),
        eq(performanceReviews.selfRatingStatus, 'not_started')
      ))
      .limit(5); // Simulate 5 employees completing their self-ratings

    if (notStartedReviews.length === 0) {
      console.log('ℹ️ No reviews with not_started status found');
      return;
    }

    console.log(`📝 Found ${notStartedReviews.length} reviews to simulate`);

    for (const { review, employee } of notStartedReviews) {
      console.log(`\n👤 Processing ${employee.fullName}'s review...`);

      // Get criteria for this review
      const criteria = await db
        .select()
        .from(kpiCriteria)
        .where(eq(kpiCriteria.templateId, review.templateId))
        .orderBy(kpiCriteria.sortOrder);

      if (criteria.length === 0) {
        console.log('   ⚠️ No criteria found for this template');
        continue;
      }

      console.log(`   📋 Found ${criteria.length} criteria to rate`);

      // Create self-ratings for each criterion
      let totalScore = 0;
      let totalWeight = 0;

      for (const criterion of criteria) {
        // Generate random score between 60-95% of max score
        const randomPercent = 0.6 + Math.random() * 0.35;
        const score = Math.round(criterion.maxScore * randomPercent);

        await db.insert(performanceRatings).values({
          reviewId: review.id,
          criterionId: criterion.id,
          selfRating: score,
          selfComments: `Self-assessment for ${criterion.name}`,
        });

        const weight = parseFloat(criterion.weight);
        totalScore += score * weight;
        totalWeight += weight;
      }

      // Calculate final score
      const finalScore = totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : '0';

      // Calculate angle scores (simplified - in real app this would be more complex)
      const angleScore = (parseFloat(finalScore) * 10).toFixed(2);

      // Update review with self-rating data
      await db
        .update(performanceReviews)
        .set({
          selfRatingStatus: 'submitted',
          selfCommitmentScore: angleScore,
          selfContributionScore: angleScore,
          selfCharacterScore: angleScore,
          selfCompetencyScore: angleScore,
          selfTotalScore: finalScore,
          selfComments: 'I have completed my self-assessment for this review period.',
          selfRatingDate: new Date().toISOString(),
        })
        .where(eq(performanceReviews.id, review.id));

      console.log(`   ✅ Self-rating completed with score: ${finalScore}`);
    }

    console.log('\n🎉 Self-rating simulation completed!');

    // Show summary
    const updatedReviews = await db
      .select()
      .from(performanceReviews)
      .where(eq(performanceReviews.reviewPeriodId, latestPeriod.id));

    const submitted = updatedReviews.filter(r => r.selfRatingStatus === 'submitted').length;
    const notStarted = updatedReviews.filter(r => r.selfRatingStatus === 'not_started').length;

    console.log('\n📊 Current status:');
    console.log(`   - Self-Rating Submitted: ${submitted}`);
    console.log(`   - Not Started: ${notStarted}`);
    console.log(`   - Total: ${updatedReviews.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

simulateSelfRatings();