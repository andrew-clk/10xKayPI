export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired';
export type EmployeeStatus = 'active' | 'inactive' | 'terminated';
export type EmployeeRole = 'super_admin' | 'manager' | 'employee';
export type KpiAngle = 'commitment' | 'contribution' | 'character' | 'competency';
export type ReviewStatus = 'not_started' | 'in_progress' | 'submitted';
export type PeriodStatus = 'open' | 'closed' | 'archived';
export type PerformanceGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type NotificationType =
  | 'review_opened'
  | 'review_due_soon'
  | 'review_overdue'
  | 'review_submitted'
  | 'review_acknowledged'
  | 'system';

export interface Company {
  id: string;
  name: string;
  logoUrl?: string | null;
  industry?: string | null;
  timezone: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: Date | null;
  billingEmail: string;
  reviewPeriodStartDay: number;
  reviewDueDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  companyId: string;
  passwordHash?: string | null;
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  departmentId?: string | null;
  position: string;
  supervisorId?: string | null;
  kpiTemplateId?: string | null;
  joinDate: string;
  terminationDate?: string | null;
  status: EmployeeStatus;
  role: EmployeeRole;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  department?: Department | null;
  supervisor?: Employee | null;
  kpiTemplate?: KpiTemplate | null;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  headId?: string | null;
  parentDepartmentId?: string | null;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface KpiTemplate {
  id: string;
  companyId: string;
  name: string;
  positionType: string;
  description?: string | null;
  isActive: boolean;
  commitmentWeight: string;
  contributionWeight: string;
  characterWeight: string;
  competencyWeight: string;
  createdAt: Date;
  updatedAt: Date;
  criteria?: KpiCriterion[];
}

export interface KpiCriterion {
  id: string;
  templateId: string;
  angle: KpiAngle;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  weight: string;
  sortOrder: number;
  minScore: number;
  maxScore: number;
  scoringGuide: string;
  examples?: Record<string, string> | null;
  notes?: string | null;
  isRequired: boolean;
  createdAt: Date;
}

export interface ReviewPeriod {
  id: string;
  companyId: string;
  periodName: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  reviewDueDate: string;
  status: PeriodStatus;
  createdAt: Date;
}

export interface PerformanceReview {
  id: string;
  companyId: string;
  employeeId: string;
  reviewPeriodId: string;
  templateId: string;
  supervisorId?: string | null;
  selfRatingStatus: ReviewStatus;
  selfRatingSubmittedAt?: Date | null;
  selfTotalScore?: string | null;
  selfRatingNotes?: string | null;
  supervisorRatingStatus: ReviewStatus;
  supervisorRatingSubmittedAt?: Date | null;
  supervisorTotalScore?: string | null;
  finalScore?: string | null;
  performanceGrade?: PerformanceGrade | null;
  strengths?: string | null;
  improvementAreas?: string | null;
  actionPlan?: string | null;
  supervisorComments?: string | null;
  employeeAcknowledged: boolean;
  employeeAcknowledgedAt?: Date | null;
  employeeComments?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined
  employee?: Employee;
  supervisor?: Employee | null;
  reviewPeriod?: ReviewPeriod;
  template?: KpiTemplate;
  ratings?: PerformanceRating[];
}

export interface PerformanceRating {
  id: string;
  reviewId: string;
  criterionId: string;
  selfRating?: number | null;
  selfComments?: string | null;
  supervisorRating?: number | null;
  supervisorComments?: string | null;
  selfWeightedScore?: string | null;
  supervisorWeightedScore?: string | null;
  createdAt: Date;
  updatedAt: Date;
  criterion?: KpiCriterion;
}

export interface Notification {
  id: string;
  companyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  read: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

export interface DashboardStats {
  totalEmployees: number;
  reviewsCompleted: number;
  reviewsTotal: number;
  averageScore: number;
  gradeDistribution: Record<PerformanceGrade, number>;
  departmentAverages: { department: string; average: number }[];
  topPerformers: { employee: Employee; score: number; grade: PerformanceGrade }[];
  pendingReviews: PendingReview[];
}

export interface PendingReview {
  reviewId: string;
  employeeName: string;
  status: string;
  dueDate: string;
  type: 'self' | 'supervisor' | 'acknowledgment';
}
