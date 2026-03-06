/**
 * Seed script for PerformX MVP demo data.
 * Run with: npm run db:seed
 *
 * Demo credentials (all passwords: demo1234):
 *   admin@demo.com      — Super Admin
 *   manager@demo.com    — Manager
 *   sarah@demo.com      — Manager (Electrical)
 *   employee@demo.com   — Employee
 *   ali@demo.com        — Employee
 *   kumar@demo.com      — Employee
 *   mei@demo.com        — Employee
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

// Load env
import { config } from 'dotenv';
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// ─── IDs ─────────────────────────────────────────────────────────────────────

const COMPANY_ID = 'c1000000-0000-0000-0000-000000000001';

const DEPT = {
  installation: 'd1000000-0000-0000-0000-000000000001',
  electrical: 'd1000000-0000-0000-0000-000000000002',
  sales: 'd1000000-0000-0000-0000-000000000003',
  admin: 'd1000000-0000-0000-0000-000000000004',
};

const EMP = {
  admin: 'e1000000-0000-0000-0000-000000000001',
  manager: 'e1000000-0000-0000-0000-000000000002',
  sarah: 'e1000000-0000-0000-0000-000000000003',
  employee: 'e1000000-0000-0000-0000-000000000004',
  ali: 'e1000000-0000-0000-0000-000000000005',
  kumar: 'e1000000-0000-0000-0000-000000000006',
  mei: 'e1000000-0000-0000-0000-000000000007',
  jason: 'e1000000-0000-0000-0000-000000000008',
};

const TMPL = {
  installer: 't1000000-0000-0000-0000-000000000001',
  sales: 't1000000-0000-0000-0000-000000000002',
};

const PERIOD = {
  jan: 'p1000000-0000-0000-0000-000000000001',
  feb: 'p1000000-0000-0000-0000-000000000002',
  mar: 'p1000000-0000-0000-0000-000000000003',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding PerformX demo data...\n');

  const PASS_HASH = await bcrypt.hash('demo1234', 12);
  const TODAY = new Date().toISOString().split('T')[0];

  // ── Company ──────────────────────────────────────────────────────────────

  await db.delete(schema.companies).where(eq(schema.companies.id, COMPANY_ID));

  await db.insert(schema.companies).values({
    id: COMPANY_ID,
    name: 'KayPI Installation Sdn Bhd',
    industry: 'Installation Services',
    timezone: 'Asia/Kuala_Lumpur',
    billingEmail: 'admin@demo.com',
    subscriptionTier: 'professional',
    subscriptionStatus: 'active',
    reviewPeriodStartDay: 1,
    reviewDueDays: 7,
  });

  console.log('✅ Company created');

  // ── Departments ──────────────────────────────────────────────────────────

  await db.insert(schema.departments).values([
    { id: DEPT.installation, companyId: COMPANY_ID, name: 'Installation', description: 'AC installation and maintenance team', status: 'active', headId: EMP.manager },
    { id: DEPT.electrical, companyId: COMPANY_ID, name: 'Electrical', description: 'Electrical wiring and panel installation', status: 'active', headId: EMP.sarah },
    { id: DEPT.sales, companyId: COMPANY_ID, name: 'Sales', description: 'Customer acquisition and account management', status: 'active' },
    { id: DEPT.admin, companyId: COMPANY_ID, name: 'Administration', description: 'HR, finance, and operations', status: 'active', headId: EMP.admin },
  ]);

  console.log('✅ Departments created');

  // ── Employees ─────────────────────────────────────────────────────────────

  await db.insert(schema.employees).values([
    {
      id: EMP.admin,
      companyId: COMPANY_ID,
      passwordHash: PASS_HASH,
      employeeId: 'EMP001',
      fullName: 'Ahmad Fauzi',
      email: 'admin@demo.com',
      phone: '+60123456781',
      position: 'General Manager',
      departmentId: DEPT.admin,
      role: 'super_admin',
      status: 'active',
      joinDate: '2020-01-01',
    },
    {
      id: EMP.manager,
      companyId: COMPANY_ID,
      passwordHash: PASS_HASH,
      employeeId: 'EMP002',
      fullName: 'Rashid Hamdan',
      email: 'manager@demo.com',
      phone: '+60123456782',
      position: 'Installation Manager',
      departmentId: DEPT.installation,
      supervisorId: EMP.admin,
      role: 'manager',
      status: 'active',
      joinDate: '2021-03-15',
    },
    {
      id: EMP.sarah,
      companyId: COMPANY_ID,
      passwordHash: PASS_HASH,
      employeeId: 'EMP003',
      fullName: 'Sarah Lim',
      email: 'sarah@demo.com',
      phone: '+60123456783',
      position: 'Electrical Supervisor',
      departmentId: DEPT.electrical,
      supervisorId: EMP.admin,
      role: 'manager',
      status: 'active',
      joinDate: '2021-06-01',
    },
    {
      id: EMP.employee,
      companyId: COMPANY_ID,
      passwordHash: PASS_HASH,
      employeeId: 'EMP004',
      fullName: 'David Tan',
      email: 'employee@demo.com',
      phone: '+60123456784',
      position: 'Installer Leader',
      departmentId: DEPT.installation,
      supervisorId: EMP.manager,
      role: 'employee',
      status: 'active',
      joinDate: '2022-01-10',
    },
    {
      id: EMP.ali,
      companyId: COMPANY_ID,
      passwordHash: PASS_HASH,
      employeeId: 'EMP005',
      fullName: 'Ali Hassan',
      email: 'ali@demo.com',
      phone: '+60123456785',
      position: 'Senior Installer',
      departmentId: DEPT.installation,
      supervisorId: EMP.manager,
      role: 'employee',
      status: 'active',
      joinDate: '2022-04-01',
    },
    {
      id: EMP.kumar,
      companyId: COMPANY_ID,
      passwordHash: PASS_HASH,
      employeeId: 'EMP006',
      fullName: 'Kumar Rajan',
      email: 'kumar@demo.com',
      phone: '+60123456786',
      position: 'Electrician',
      departmentId: DEPT.electrical,
      supervisorId: EMP.sarah,
      role: 'employee',
      status: 'active',
      joinDate: '2022-07-15',
    },
    {
      id: EMP.mei,
      companyId: COMPANY_ID,
      passwordHash: PASS_HASH,
      employeeId: 'EMP007',
      fullName: 'Mei Ling',
      email: 'mei@demo.com',
      phone: '+60123456787',
      position: 'Sales Executive',
      departmentId: DEPT.sales,
      supervisorId: EMP.admin,
      role: 'employee',
      status: 'active',
      joinDate: '2023-01-02',
    },
    {
      id: EMP.jason,
      companyId: COMPANY_ID,
      passwordHash: PASS_HASH,
      employeeId: 'EMP008',
      fullName: 'Jason Wong',
      email: 'jason@demo.com',
      phone: '+60123456788',
      position: 'Installer',
      departmentId: DEPT.installation,
      supervisorId: EMP.manager,
      role: 'employee',
      status: 'active',
      joinDate: '2023-06-01',
    },
  ]);

  console.log('✅ Employees created (8 total)');

  // ── KPI Templates ─────────────────────────────────────────────────────────

  await db.insert(schema.kpiTemplates).values([
    {
      id: TMPL.installer,
      companyId: COMPANY_ID,
      name: 'Installer / Technician KPI',
      positionType: 'Installer',
      description: 'KPI framework for installation and technical staff',
      isActive: true,
      commitmentWeight: '40.00',
      contributionWeight: '40.00',
      characterWeight: '10.00',
      competencyWeight: '10.00',
    },
    {
      id: TMPL.sales,
      companyId: COMPANY_ID,
      name: 'Sales Staff KPI',
      positionType: 'Sales',
      description: 'KPI framework for sales executives',
      isActive: true,
      commitmentWeight: '30.00',
      contributionWeight: '50.00',
      characterWeight: '10.00',
      competencyWeight: '10.00',
    },
  ]);

  // Criteria for Installer template
  const installerCriteria = [
    // Commitment (4 criteria × 25% each = 100%)
    { angle: 'commitment' as const, name: 'Kehadiran & Ketepatan Masa', nameEn: 'Attendance & Punctuality', weight: '25.00', sortOrder: 1, minScore: 0, maxScore: 10, scoringGuide: '10=Never late/absent; 7-9=Rarely late; 4-6=Occasionally late; 0-3=Frequently absent/late', isRequired: true },
    { angle: 'commitment' as const, name: 'Pematuhan SOP', nameEn: 'SOP Compliance', weight: '25.00', sortOrder: 2, minScore: 0, maxScore: 10, scoringGuide: '10=Always follows SOP; 7-9=Mostly compliant; 4-6=Sometimes deviates; 0-3=Frequently non-compliant', isRequired: true },
    { angle: 'commitment' as const, name: 'Tanggungjawab Kerja', nameEn: 'Job Responsibility', weight: '25.00', sortOrder: 3, minScore: 0, maxScore: 10, scoringGuide: '10=Takes full ownership; 7-9=Reliable; 4-6=Needs reminders; 0-3=Avoids responsibility', isRequired: true },
    { angle: 'commitment' as const, name: 'Masa Lebih (Overtime)', nameEn: 'Willingness for Overtime', weight: '25.00', sortOrder: 4, minScore: 0, maxScore: 10, scoringGuide: '10=Always willing; 7-9=Usually willing; 4-6=Occasionally; 0-3=Rarely/Never', isRequired: false },
    // Contribution (3 criteria)
    { angle: 'contribution' as const, name: 'Kuantiti Kerja', nameEn: 'Work Quantity', weight: '40.00', sortOrder: 5, minScore: 0, maxScore: 10, scoringGuide: '10=Exceeds targets consistently; 7-9=Meets targets; 4-6=Below target; 0-3=Significantly below', isRequired: true },
    { angle: 'contribution' as const, name: 'Kualiti Kerja', nameEn: 'Work Quality', weight: '40.00', sortOrder: 6, minScore: 0, maxScore: 10, scoringGuide: '10=Zero defects, excellent finish; 7-9=Minor issues; 4-6=Some rework needed; 0-3=Frequent rework', isRequired: true },
    { angle: 'contribution' as const, name: 'Maklum Balas Pelanggan', nameEn: 'Customer Feedback', weight: '20.00', sortOrder: 7, minScore: 0, maxScore: 10, scoringGuide: '10=Consistently praised; 7-9=Positive feedback; 4-6=Neutral; 0-3=Complaints received', isRequired: true },
    // Character (2 criteria)
    { angle: 'character' as const, name: 'Sikap & Disiplin', nameEn: 'Attitude & Discipline', weight: '50.00', sortOrder: 8, minScore: 0, maxScore: 10, scoringGuide: '10=Exemplary behavior; 7-9=Professional; 4-6=Acceptable; 0-3=Disciplinary issues', isRequired: true },
    { angle: 'character' as const, name: 'Kerja Berpasukan', nameEn: 'Teamwork', weight: '50.00', sortOrder: 9, minScore: 0, maxScore: 10, scoringGuide: '10=Team leader; 7-9=Good team player; 4-6=Works independently; 0-3=Poor collaboration', isRequired: true },
    // Competency (2 criteria)
    { angle: 'competency' as const, name: 'Kemahiran Teknikal', nameEn: 'Technical Skills', weight: '60.00', sortOrder: 10, minScore: 0, maxScore: 10, scoringGuide: '10=Expert level; 7-9=Proficient; 4-6=Developing; 0-3=Basic', isRequired: true },
    { angle: 'competency' as const, name: 'Penyelesaian Masalah', nameEn: 'Problem Solving', weight: '40.00', sortOrder: 11, minScore: 0, maxScore: 10, scoringGuide: '10=Independently resolves complex issues; 7-9=Handles most issues; 4-6=Needs guidance; 0-3=Escalates frequently', isRequired: true },
  ];

  const salesCriteria = [
    { angle: 'commitment' as const, name: 'Kehadiran & Ketepatan Masa', nameEn: 'Attendance & Punctuality', weight: '33.33', sortOrder: 1, minScore: 0, maxScore: 10, scoringGuide: '10=Perfect attendance; 7-9=Rarely absent; 4-6=Some absences; 0-3=Frequent absences', isRequired: true },
    { angle: 'commitment' as const, name: 'Aktiviti Jualan Harian', nameEn: 'Daily Sales Activities', weight: '33.33', sortOrder: 2, minScore: 0, maxScore: 10, scoringGuide: '10=Exceeds daily call/visit targets; 7-9=Meets targets; 4-6=Below target; 0-3=Significantly below', isRequired: true },
    { angle: 'commitment' as const, name: 'CRM Updates', nameEn: 'CRM & Reporting Compliance', weight: '33.34', sortOrder: 3, minScore: 0, maxScore: 10, scoringGuide: '10=Always up to date; 7-9=Usually current; 4-6=Delayed updates; 0-3=Rarely updated', isRequired: true },
    { angle: 'contribution' as const, name: 'Pencapaian Sasaran Jualan', nameEn: 'Sales Target Achievement', weight: '50.00', sortOrder: 4, minScore: 0, maxScore: 10, scoringGuide: '10=≥120% of target; 9=110-119%; 8=100-109%; 7=90-99%; 4-6=70-89%; 0-3=<70%', isRequired: true },
    { angle: 'contribution' as const, name: 'Pelanggan Baru', nameEn: 'New Customer Acquisition', weight: '30.00', sortOrder: 5, minScore: 0, maxScore: 10, scoringGuide: '10=Far exceeds new customer target; 7-9=Meets target; 4-6=Below target', isRequired: true },
    { angle: 'contribution' as const, name: 'Kepuasan Pelanggan', nameEn: 'Customer Satisfaction', weight: '20.00', sortOrder: 6, minScore: 0, maxScore: 10, scoringGuide: '10=All clients highly satisfied; 7-9=Most satisfied; 4-6=Average; 0-3=Complaints', isRequired: true },
    { angle: 'character' as const, name: 'Integriti & Etika', nameEn: 'Integrity & Ethics', weight: '50.00', sortOrder: 7, minScore: 0, maxScore: 10, scoringGuide: '10=Exemplary integrity; 7-9=Always ethical; 4-6=Mostly ethical; 0-3=Issues noted', isRequired: true },
    { angle: 'character' as const, name: 'Komunikasi', nameEn: 'Communication', weight: '50.00', sortOrder: 8, minScore: 0, maxScore: 10, scoringGuide: '10=Excellent communicator; 7-9=Good communication; 4-6=Adequate; 0-3=Poor communication', isRequired: true },
    { angle: 'competency' as const, name: 'Pengetahuan Produk', nameEn: 'Product Knowledge', weight: '50.00', sortOrder: 9, minScore: 0, maxScore: 10, scoringGuide: '10=Expert in all products; 7-9=Good knowledge; 4-6=Basic knowledge; 0-3=Limited knowledge', isRequired: true },
    { angle: 'competency' as const, name: 'Kemahiran Rundingan', nameEn: 'Negotiation Skills', weight: '50.00', sortOrder: 10, minScore: 0, maxScore: 10, scoringGuide: '10=Closes complex deals independently; 7-9=Good closer; 4-6=Needs support; 0-3=Struggles to close', isRequired: true },
  ];

  const installerCriteriaRows = installerCriteria.map((c, i) => ({
    id: `c1${String(i + 1).padStart(7, '0')}-0000-0000-0000-000000000001`,
    templateId: TMPL.installer,
    ...c,
  }));

  const salesCriteriaRows = salesCriteria.map((c, i) => ({
    id: `c2${String(i + 1).padStart(7, '0')}-0000-0000-0000-000000000001`,
    templateId: TMPL.sales,
    ...c,
  }));

  await db.insert(schema.kpiCriteria).values([...installerCriteriaRows, ...salesCriteriaRows]);

  console.log('✅ KPI templates + criteria created (2 templates, 21 criteria)');

  // ── Review Periods ────────────────────────────────────────────────────────

  await db.insert(schema.reviewPeriods).values([
    {
      id: PERIOD.jan,
      companyId: COMPANY_ID,
      periodName: 'January 2025',
      year: 2025,
      month: 1,
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      reviewDueDate: '2025-02-07',
      status: 'closed',
    },
    {
      id: PERIOD.feb,
      companyId: COMPANY_ID,
      periodName: 'February 2025',
      year: 2025,
      month: 2,
      startDate: '2025-02-01',
      endDate: '2025-02-28',
      reviewDueDate: '2025-03-07',
      status: 'closed',
    },
    {
      id: PERIOD.mar,
      companyId: COMPANY_ID,
      periodName: 'March 2025',
      year: 2025,
      month: 3,
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      reviewDueDate: '2025-04-07',
      status: 'open',
    },
  ]);

  console.log('✅ Review periods created (Jan-Mar 2025)');

  // ── Performance Reviews + Ratings ─────────────────────────────────────────

  // Helper to generate review ID
  const reviewId = (emp: string, period: string) =>
    `r${emp.slice(1, 9)}-${period.slice(1, 9)}-0000-0000-000000000001`;

  // Employees to review: installation staff use installer template, sales uses sales template
  const reviewConfigs = [
    // David Tan — Installer, supervisor: Rashid
    { empId: EMP.employee, supId: EMP.manager, templateId: TMPL.installer },
    // Ali Hassan — Installer, supervisor: Rashid
    { empId: EMP.ali, supId: EMP.manager, templateId: TMPL.installer },
    // Kumar Rajan — Electrician, supervisor: Sarah
    { empId: EMP.kumar, supId: EMP.sarah, templateId: TMPL.installer },
    // Mei Ling — Sales, supervisor: Ahmad (admin)
    { empId: EMP.mei, supId: EMP.admin, templateId: TMPL.sales },
    // Jason Wong — Installer, supervisor: Rashid
    { empId: EMP.jason, supId: EMP.manager, templateId: TMPL.installer },
  ];

  // Jan & Feb: fully completed (submitted + acknowledged)
  // Mar: self-rating submitted but supervisor not done (action required state)

  const reviewsToInsert = [];
  const ratingsToInsert = [];

  for (const cfg of reviewConfigs) {
    // Jan — fully completed
    const janId = reviewId(cfg.empId, PERIOD.jan);
    const janSelfScore = (75 + Math.random() * 20).toFixed(2);
    const janSupScore = (parseFloat(janSelfScore) + (Math.random() * 4 - 2)).toFixed(2);
    const janFinal = janSupScore;
    const janGrade = parseFloat(janFinal) >= 90 ? 'A' : parseFloat(janFinal) >= 80 ? 'B' : parseFloat(janFinal) >= 70 ? 'C' : parseFloat(janFinal) >= 60 ? 'D' : 'E';

    reviewsToInsert.push({
      id: janId,
      companyId: COMPANY_ID,
      employeeId: cfg.empId,
      reviewPeriodId: PERIOD.jan,
      templateId: cfg.templateId,
      supervisorId: cfg.supId,
      selfRatingStatus: 'submitted' as const,
      selfRatingSubmittedAt: new Date('2025-02-03'),
      selfTotalScore: janSelfScore,
      supervisorRatingStatus: 'submitted' as const,
      supervisorRatingSubmittedAt: new Date('2025-02-05'),
      supervisorTotalScore: janSupScore,
      finalScore: janFinal,
      performanceGrade: janGrade as 'A' | 'B' | 'C' | 'D' | 'E',
      strengths: 'Strong technical skills and reliable attendance. Works well with team members.',
      improvementAreas: 'Could improve customer communication and documentation speed.',
      actionPlan: 'Enroll in customer service workshop by end of Q1. Practice daily reporting.',
      supervisorComments: 'Good overall performance. Keep up the consistency.',
      employeeAcknowledged: true,
      employeeAcknowledgedAt: new Date('2025-02-06'),
      employeeComments: 'Thank you for the feedback. I will work on the areas mentioned.',
    });

    // Feb — submitted and acknowledged
    const febId = reviewId(cfg.empId, PERIOD.feb);
    const febSelfScore = (78 + Math.random() * 18).toFixed(2);
    const febSupScore = (parseFloat(febSelfScore) + (Math.random() * 4 - 2)).toFixed(2);
    const febFinal = febSupScore;
    const febGrade = parseFloat(febFinal) >= 90 ? 'A' : parseFloat(febFinal) >= 80 ? 'B' : parseFloat(febFinal) >= 70 ? 'C' : parseFloat(febFinal) >= 60 ? 'D' : 'E';

    reviewsToInsert.push({
      id: febId,
      companyId: COMPANY_ID,
      employeeId: cfg.empId,
      reviewPeriodId: PERIOD.feb,
      templateId: cfg.templateId,
      supervisorId: cfg.supId,
      selfRatingStatus: 'submitted' as const,
      selfRatingSubmittedAt: new Date('2025-03-03'),
      selfTotalScore: febSelfScore,
      supervisorRatingStatus: 'submitted' as const,
      supervisorRatingSubmittedAt: new Date('2025-03-05'),
      supervisorTotalScore: febSupScore,
      finalScore: febFinal,
      performanceGrade: febGrade as 'A' | 'B' | 'C' | 'D' | 'E',
      strengths: 'Showed improvement from last month. Good initiative on the new project.',
      improvementAreas: 'Time management during peak periods needs attention.',
      actionPlan: 'Use daily planner tool. Review weekly with supervisor.',
      supervisorComments: 'Noticeable improvement this month. On track.',
      employeeAcknowledged: true,
      employeeAcknowledgedAt: new Date('2025-03-06'),
    });

    // Mar — self submitted, supervisor pending (action required)
    const marId = reviewId(cfg.empId, PERIOD.mar);
    const marSelfScore = (80 + Math.random() * 15).toFixed(2);

    reviewsToInsert.push({
      id: marId,
      companyId: COMPANY_ID,
      employeeId: cfg.empId,
      reviewPeriodId: PERIOD.mar,
      templateId: cfg.templateId,
      supervisorId: cfg.supId,
      selfRatingStatus: 'submitted' as const,
      selfRatingSubmittedAt: new Date('2025-04-02'),
      selfTotalScore: marSelfScore,
      supervisorRatingStatus: 'not_started' as const,
      employeeAcknowledged: false,
    });

    // Add ratings for Jan reviews
    const janCriteria = cfg.templateId === TMPL.installer ? installerCriteriaRows : salesCriteriaRows;
    for (const c of janCriteria) {
      const selfRating = Math.floor(7 + Math.random() * 3);
      const supRating = Math.min(10, Math.max(0, selfRating + Math.floor(Math.random() * 3) - 1));
      const aw = cfg.templateId === TMPL.installer
        ? ({ commitment: 40, contribution: 40, character: 10, competency: 10 } as Record<string, number>)[c.angle]!
        : ({ commitment: 30, contribution: 50, character: 10, competency: 10 } as Record<string, number>)[c.angle]!;
      const cw = parseFloat(c.weight);
      ratingsToInsert.push({
        id: `rt-${janId}-${c.id}`.slice(0, 36),
        reviewId: janId,
        criterionId: c.id,
        selfRating,
        selfComments: 'Met expectations for this period.',
        supervisorRating: supRating,
        supervisorComments: Math.abs(selfRating - supRating) > 1 ? 'Based on observed performance, slight adjustment applied.' : null,
        selfWeightedScore: (selfRating * (cw / 100) * (aw / 100) * 100).toFixed(4),
        supervisorWeightedScore: (supRating * (cw / 100) * (aw / 100) * 100).toFixed(4),
      });
    }

    // Add ratings for Mar (self only)
    const marCriteria = cfg.templateId === TMPL.installer ? installerCriteriaRows : salesCriteriaRows;
    for (const c of marCriteria) {
      const selfRating = Math.floor(8 + Math.random() * 2);
      const aw = cfg.templateId === TMPL.installer
        ? ({ commitment: 40, contribution: 40, character: 10, competency: 10 } as Record<string, number>)[c.angle]!
        : ({ commitment: 30, contribution: 50, character: 10, competency: 10 } as Record<string, number>)[c.angle]!;
      const cw = parseFloat(c.weight);
      ratingsToInsert.push({
        id: `rs-${reviewId(cfg.empId, PERIOD.mar)}-${c.id}`.slice(0, 36),
        reviewId: reviewId(cfg.empId, PERIOD.mar),
        criterionId: c.id,
        selfRating,
        selfComments: 'Good performance this month.',
        selfWeightedScore: (selfRating * (cw / 100) * (aw / 100) * 100).toFixed(4),
      });
    }
  }

  await db.insert(schema.performanceReviews).values(reviewsToInsert);
  await db.insert(schema.performanceRatings).values(ratingsToInsert);

  console.log(`✅ Performance reviews created (${reviewsToInsert.length} reviews, ${ratingsToInsert.length} ratings)`);

  // ── Notifications ─────────────────────────────────────────────────────────

  await db.insert(schema.notifications).values([
    {
      companyId: COMPANY_ID,
      userId: EMP.manager,
      type: 'review_submitted' as const,
      title: 'March Review Ready for Rating',
      message: 'David Tan has submitted his self-rating for March 2025. Please review and provide your supervisor rating.',
      actionUrl: `/dashboard/reviews/${reviewId(EMP.employee, PERIOD.mar)}/supervisor-rating`,
      read: false,
    },
    {
      companyId: COMPANY_ID,
      userId: EMP.manager,
      type: 'review_submitted' as const,
      title: 'March Review Ready for Rating',
      message: 'Ali Hassan has submitted his self-rating for March 2025.',
      actionUrl: `/dashboard/reviews/${reviewId(EMP.ali, PERIOD.mar)}/supervisor-rating`,
      read: false,
    },
    {
      companyId: COMPANY_ID,
      userId: EMP.admin,
      type: 'system' as const,
      title: 'Welcome to PerformX!',
      message: 'Your demo account is set up. Explore the dashboard, review templates, and manage your team.',
      read: false,
    },
    {
      companyId: COMPANY_ID,
      userId: EMP.employee,
      type: 'review_opened' as const,
      title: 'March 2025 Review Open',
      message: 'Your performance review for March 2025 is now open. Please complete your self-rating by April 7.',
      actionUrl: `/dashboard/reviews/${reviewId(EMP.employee, PERIOD.mar)}/self-rating`,
      read: true,
    },
  ]);

  console.log('✅ Notifications created');

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo logins (password: demo1234):');
  console.log('  admin@demo.com    — Super Admin (Ahmad Fauzi)');
  console.log('  manager@demo.com  — Manager (Rashid Hamdan)');
  console.log('  sarah@demo.com    — Manager (Sarah Lim)');
  console.log('  employee@demo.com — Employee (David Tan)');
  console.log('  ali@demo.com      — Employee (Ali Hassan)');
  console.log('  kumar@demo.com    — Employee (Kumar Rajan)');
  console.log('  mei@demo.com      — Employee (Mei Ling)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
