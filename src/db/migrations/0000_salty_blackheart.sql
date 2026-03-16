CREATE TYPE "public"."department_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."employee_role" AS ENUM('super_admin', 'manager', 'employee');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('active', 'inactive', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."kpi_angle" AS ENUM('commitment', 'contribution', 'character', 'competency');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('review_opened', 'review_due_soon', 'review_overdue', 'review_submitted', 'review_acknowledged', 'system');--> statement-breakpoint
CREATE TYPE "public"."performance_grade" AS ENUM('A', 'B', 'C', 'D', 'E');--> statement-breakpoint
CREATE TYPE "public"."period_status" AS ENUM('open', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('not_started', 'in_progress', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"industry" text,
	"timezone" text DEFAULT 'Asia/Kuala_Lumpur' NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"subscription_status" "subscription_status" DEFAULT 'trial' NOT NULL,
	"trial_ends_at" timestamp,
	"billing_email" text DEFAULT '' NOT NULL,
	"stripe_customer_id" text,
	"review_period_start_day" integer DEFAULT 1 NOT NULL,
	"review_due_days" integer DEFAULT 7 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"head_id" uuid,
	"parent_department_id" uuid,
	"status" "department_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_company_id_name_unique" UNIQUE("company_id","name")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"password_hash" text,
	"employee_id" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"photo_url" text,
	"department_id" uuid,
	"position" text NOT NULL,
	"supervisor_id" uuid,
	"kpi_template_id" uuid,
	"join_date" date NOT NULL,
	"termination_date" date,
	"status" "employee_status" DEFAULT 'active' NOT NULL,
	"role" "employee_role" DEFAULT 'employee' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_company_id_email_unique" UNIQUE("company_id","email"),
	CONSTRAINT "employees_company_id_employee_id_unique" UNIQUE("company_id","employee_id")
);
--> statement-breakpoint
CREATE TABLE "kpi_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"angle" "kpi_angle" NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"description" text,
	"weight" numeric(5, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"min_score" integer DEFAULT 0 NOT NULL,
	"max_score" integer DEFAULT 10 NOT NULL,
	"scoring_guide" text DEFAULT '' NOT NULL,
	"examples" jsonb,
	"notes" text,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position_type" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"commitment_weight" numeric(5, 2) DEFAULT '40.00' NOT NULL,
	"contribution_weight" numeric(5, 2) DEFAULT '40.00' NOT NULL,
	"character_weight" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"competency_weight" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"action_url" text,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"criterion_id" uuid NOT NULL,
	"self_rating" integer,
	"self_comments" text,
	"supervisor_rating" integer,
	"supervisor_comments" text,
	"self_weighted_score" numeric(8, 4),
	"supervisor_weighted_score" numeric(8, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "performance_ratings_review_id_criterion_id_unique" UNIQUE("review_id","criterion_id")
);
--> statement-breakpoint
CREATE TABLE "performance_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"review_period_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"supervisor_id" uuid,
	"self_rating_status" "review_status" DEFAULT 'not_started' NOT NULL,
	"self_rating_submitted_at" timestamp,
	"self_total_score" numeric(6, 2),
	"self_rating_notes" text,
	"supervisor_rating_status" "review_status" DEFAULT 'not_started' NOT NULL,
	"supervisor_rating_submitted_at" timestamp,
	"supervisor_total_score" numeric(6, 2),
	"final_score" numeric(6, 2),
	"performance_grade" "performance_grade",
	"strengths" text,
	"improvement_areas" text,
	"action_plan" text,
	"supervisor_comments" text,
	"employee_acknowledged" boolean DEFAULT false NOT NULL,
	"employee_acknowledged_at" timestamp,
	"employee_comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "performance_reviews_company_id_employee_id_review_period_id_unique" UNIQUE("company_id","employee_id","review_period_id")
);
--> statement-breakpoint
CREATE TABLE "review_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"period_name" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"review_due_date" date NOT NULL,
	"status" "period_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_periods_company_id_year_month_unique" UNIQUE("company_id","year","month")
);
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_kpi_template_id_kpi_templates_id_fk" FOREIGN KEY ("kpi_template_id") REFERENCES "public"."kpi_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_criteria" ADD CONSTRAINT "kpi_criteria_template_id_kpi_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."kpi_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_templates" ADD CONSTRAINT "kpi_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_templates" ADD CONSTRAINT "kpi_templates_updated_by_employees_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_ratings" ADD CONSTRAINT "performance_ratings_review_id_performance_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."performance_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_ratings" ADD CONSTRAINT "performance_ratings_criterion_id_kpi_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."kpi_criteria"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_review_period_id_review_periods_id_fk" FOREIGN KEY ("review_period_id") REFERENCES "public"."review_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_template_id_kpi_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."kpi_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_supervisor_id_employees_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_periods" ADD CONSTRAINT "review_periods_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;