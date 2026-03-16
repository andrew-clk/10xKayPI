import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  date,
  pgEnum,
  unique,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'starter',
  'professional',
  'enterprise',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trial',
  'active',
  'cancelled',
  'expired',
]);

export const employeeStatusEnum = pgEnum('employee_status', [
  'active',
  'inactive',
  'terminated',
]);

export const employeeRoleEnum = pgEnum('employee_role', [
  'super_admin',
  'manager',
  'employee',
]);

export const kpiAngleEnum = pgEnum('kpi_angle', [
  'commitment',
  'contribution',
  'character',
  'competency',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'not_started',
  'in_progress',
  'submitted',
]);

export const periodStatusEnum = pgEnum('period_status', [
  'open',
  'closed',
  'archived',
]);

export const performanceGradeEnum = pgEnum('performance_grade', [
  'A',
  'B',
  'C',
  'D',
  'E',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'review_opened',
  'review_due_soon',
  'review_overdue',
  'review_submitted',
  'review_acknowledged',
  'system',
]);

export const departmentStatusEnum = pgEnum('department_status', [
  'active',
  'inactive',
]);

// ─── Companies ───────────────────────────────────────────────────────────────

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  industry: text('industry'),
  timezone: text('timezone').notNull().default('Asia/Kuala_Lumpur'),
  subscriptionTier: subscriptionTierEnum('subscription_tier')
    .notNull()
    .default('free'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status')
    .notNull()
    .default('trial'),
  trialEndsAt: timestamp('trial_ends_at'),
  billingEmail: text('billing_email').notNull().default(''),
  stripeCustomerId: text('stripe_customer_id'),
  reviewPeriodStartDay: integer('review_period_start_day').notNull().default(1),
  reviewDueDays: integer('review_due_days').notNull().default(7),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Departments ─────────────────────────────────────────────────────────────

export const departments = pgTable(
  'departments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    headId: uuid('head_id'),
    parentDepartmentId: uuid('parent_department_id'),
    status: departmentStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.companyId, t.name)]
);

// ─── Employees ───────────────────────────────────────────────────────────────

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    passwordHash: text('password_hash'),
    employeeId: text('employee_id').notNull(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    photoUrl: text('photo_url'),
    departmentId: uuid('department_id').references(() => departments.id, {
      onDelete: 'set null',
    }),
    position: text('position').notNull(),
    supervisorId: uuid('supervisor_id'),
    kpiTemplateId: uuid('kpi_template_id').references(() => kpiTemplates.id, {
      onDelete: 'set null',
    }),
    joinDate: date('join_date').notNull(),
    terminationDate: date('termination_date'),
    status: employeeStatusEnum('status').notNull().default('active'),
    role: employeeRoleEnum('role').notNull().default('employee'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.companyId, t.email),
    unique().on(t.companyId, t.employeeId),
  ]
);

// ─── KPI Templates ───────────────────────────────────────────────────────────

export const kpiTemplates = pgTable('kpi_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  positionType: text('position_type').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  commitmentWeight: decimal('commitment_weight', { precision: 5, scale: 2 })
    .notNull()
    .default('40.00'),
  contributionWeight: decimal('contribution_weight', { precision: 5, scale: 2 })
    .notNull()
    .default('40.00'),
  characterWeight: decimal('character_weight', { precision: 5, scale: 2 })
    .notNull()
    .default('10.00'),
  competencyWeight: decimal('competency_weight', { precision: 5, scale: 2 })
    .notNull()
    .default('10.00'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => employees.id),
});

// ─── KPI Criteria ─────────────────────────────────────────────────────────────

export const kpiCriteria = pgTable('kpi_criteria', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id')
    .notNull()
    .references(() => kpiTemplates.id, { onDelete: 'cascade' }),
  angle: kpiAngleEnum('angle').notNull(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  description: text('description'),
  weight: decimal('weight', { precision: 5, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  minScore: integer('min_score').notNull().default(0),
  maxScore: integer('max_score').notNull().default(10),
  scoringGuide: text('scoring_guide').notNull().default(''),
  examples: jsonb('examples'),
  notes: text('notes'),
  isRequired: boolean('is_required').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Review Periods ───────────────────────────────────────────────────────────

export const reviewPeriods = pgTable(
  'review_periods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    periodName: text('period_name').notNull(),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    reviewDueDate: date('review_due_date').notNull(),
    status: periodStatusEnum('status').notNull().default('open'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.companyId, t.year, t.month)]
);

// ─── Performance Reviews ──────────────────────────────────────────────────────

export const performanceReviews = pgTable(
  'performance_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    reviewPeriodId: uuid('review_period_id')
      .notNull()
      .references(() => reviewPeriods.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id')
      .notNull()
      .references(() => kpiTemplates.id, { onDelete: 'restrict' }),
    supervisorId: uuid('supervisor_id').references(() => employees.id, {
      onDelete: 'set null',
    }),
    selfRatingStatus: reviewStatusEnum('self_rating_status')
      .notNull()
      .default('not_started'),
    selfRatingSubmittedAt: timestamp('self_rating_submitted_at'),
    selfTotalScore: decimal('self_total_score', { precision: 6, scale: 2 }),
    selfRatingNotes: text('self_rating_notes'),
    supervisorRatingStatus: reviewStatusEnum('supervisor_rating_status')
      .notNull()
      .default('not_started'),
    supervisorRatingSubmittedAt: timestamp('supervisor_rating_submitted_at'),
    supervisorTotalScore: decimal('supervisor_total_score', {
      precision: 6,
      scale: 2,
    }),
    finalScore: decimal('final_score', { precision: 6, scale: 2 }),
    performanceGrade: performanceGradeEnum('performance_grade'),
    strengths: text('strengths'),
    improvementAreas: text('improvement_areas'),
    actionPlan: text('action_plan'),
    supervisorComments: text('supervisor_comments'),
    employeeAcknowledged: boolean('employee_acknowledged')
      .notNull()
      .default(false),
    employeeAcknowledgedAt: timestamp('employee_acknowledged_at'),
    employeeComments: text('employee_comments'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.companyId, t.employeeId, t.reviewPeriodId)]
);

// ─── Performance Ratings ──────────────────────────────────────────────────────

export const performanceRatings = pgTable(
  'performance_ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reviewId: uuid('review_id')
      .notNull()
      .references(() => performanceReviews.id, { onDelete: 'cascade' }),
    criterionId: uuid('criterion_id')
      .notNull()
      .references(() => kpiCriteria.id, { onDelete: 'cascade' }),
    selfRating: integer('self_rating'),
    selfComments: text('self_comments'),
    supervisorRating: integer('supervisor_rating'),
    supervisorComments: text('supervisor_comments'),
    selfWeightedScore: decimal('self_weighted_score', {
      precision: 8,
      scale: 4,
    }),
    supervisorWeightedScore: decimal('supervisor_weighted_score', {
      precision: 8,
      scale: 4,
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.reviewId, t.criterionId)]
);

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'),
  read: boolean('read').notNull().default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const companiesRelations = relations(companies, ({ many }) => ({
  employees: many(employees),
  departments: many(departments),
  kpiTemplates: many(kpiTemplates),
  reviewPeriods: many(reviewPeriods),
  performanceReviews: many(performanceReviews),
  notifications: many(notifications),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  company: one(companies, {
    fields: [departments.companyId],
    references: [companies.id],
  }),
  head: one(employees, {
    fields: [departments.headId],
    references: [employees.id],
    relationName: 'departmentHead',
  }),
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  supervisor: one(employees, {
    fields: [employees.supervisorId],
    references: [employees.id],
    relationName: 'employeeSupervisor',
  }),
  kpiTemplate: one(kpiTemplates, {
    fields: [employees.kpiTemplateId],
    references: [kpiTemplates.id],
  }),
  subordinates: many(employees, { relationName: 'employeeSupervisor' }),
  reviews: many(performanceReviews, { relationName: 'employeeReviews' }),
  supervisedReviews: many(performanceReviews, {
    relationName: 'supervisorReviews',
  }),
  notifications: many(notifications),
}));

export const kpiTemplatesRelations = relations(kpiTemplates, ({ one, many }) => ({
  company: one(companies, {
    fields: [kpiTemplates.companyId],
    references: [companies.id],
  }),
  criteria: many(kpiCriteria),
}));

export const kpiCriteriaRelations = relations(kpiCriteria, ({ one, many }) => ({
  template: one(kpiTemplates, {
    fields: [kpiCriteria.templateId],
    references: [kpiTemplates.id],
  }),
  ratings: many(performanceRatings),
}));

export const reviewPeriodsRelations = relations(reviewPeriods, ({ one, many }) => ({
  company: one(companies, {
    fields: [reviewPeriods.companyId],
    references: [companies.id],
  }),
  reviews: many(performanceReviews),
}));

export const performanceReviewsRelations = relations(
  performanceReviews,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [performanceReviews.companyId],
      references: [companies.id],
    }),
    employee: one(employees, {
      fields: [performanceReviews.employeeId],
      references: [employees.id],
      relationName: 'employeeReviews',
    }),
    supervisor: one(employees, {
      fields: [performanceReviews.supervisorId],
      references: [employees.id],
      relationName: 'supervisorReviews',
    }),
    reviewPeriod: one(reviewPeriods, {
      fields: [performanceReviews.reviewPeriodId],
      references: [reviewPeriods.id],
    }),
    template: one(kpiTemplates, {
      fields: [performanceReviews.templateId],
      references: [kpiTemplates.id],
    }),
    ratings: many(performanceRatings),
  })
);

export const performanceRatingsRelations = relations(
  performanceRatings,
  ({ one }) => ({
    review: one(performanceReviews, {
      fields: [performanceRatings.reviewId],
      references: [performanceReviews.id],
    }),
    criterion: one(kpiCriteria, {
      fields: [performanceRatings.criterionId],
      references: [kpiCriteria.id],
    }),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  company: one(companies, {
    fields: [notifications.companyId],
    references: [companies.id],
  }),
  user: one(employees, {
    fields: [notifications.userId],
    references: [employees.id],
  }),
}));
