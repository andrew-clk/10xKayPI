import type { EmployeeRole } from '@/types';

/**
 * Role-Based Access Control (RBAC) System
 *
 * Hierarchy:
 * 1. Super Admin - Full access to everything
 * 2. Manager - Can manage templates, view reports of subordinates
 * 3. Leader - Can view reports of their team members only
 * 4. Employee - Can only view their own information
 */

// Role hierarchy levels (higher number = more permissions)
export const ROLE_LEVELS: Record<EmployeeRole, number> = {
  super_admin: 4,
  manager: 3,
  leader: 2,
  employee: 1,
};

// Permission definitions
export const PERMISSIONS = {
  // Company Management
  MANAGE_COMPANY: ['super_admin'],
  VIEW_ALL_EMPLOYEES: ['super_admin'],

  // Employee Management
  CREATE_EMPLOYEE: ['super_admin', 'manager'],
  EDIT_ANY_EMPLOYEE: ['super_admin'],
  EDIT_SUBORDINATE: ['super_admin', 'manager', 'leader'],
  VIEW_SUBORDINATE: ['super_admin', 'manager', 'leader'],
  DEACTIVATE_EMPLOYEE: ['super_admin', 'manager'],

  // KPI Template Management
  CREATE_TEMPLATE: ['super_admin', 'manager'],
  EDIT_TEMPLATE: ['super_admin', 'manager'],
  DELETE_TEMPLATE: ['super_admin', 'manager'],
  VIEW_TEMPLATE: ['super_admin', 'manager'],

  // Review Management
  CREATE_REVIEW_PERIOD: ['super_admin'],
  VIEW_ALL_REVIEWS: ['super_admin'],
  VIEW_SUBORDINATE_REVIEWS: ['super_admin', 'manager', 'leader'],
  RATE_SUBORDINATE: ['super_admin', 'manager', 'leader'],

  // Reports
  VIEW_ALL_REPORTS: ['super_admin'],
  VIEW_DEPARTMENT_REPORTS: ['super_admin', 'manager'],
  VIEW_TEAM_REPORTS: ['super_admin', 'manager', 'leader'],
  EXPORT_REPORTS: ['super_admin', 'manager'],

  // Department Management
  MANAGE_DEPARTMENTS: ['super_admin'],
  VIEW_DEPARTMENTS: ['super_admin', 'manager', 'leader'],

  // Settings & Configuration
  MANAGE_SETTINGS: ['super_admin'],
  VIEW_SETTINGS: ['super_admin', 'manager'],

  // Notifications
  SEND_BULK_NOTIFICATIONS: ['super_admin'],
  VIEW_ALL_NOTIFICATIONS: ['super_admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  userRole: EmployeeRole,
  permission: Permission
): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole as any);
}

/**
 * Check if a user can manage another user based on hierarchy
 */
export function canManageUser(
  managerRole: EmployeeRole,
  managerId: string,
  targetRole: EmployeeRole,
  targetSupervisorId: string | null
): boolean {
  // Super admin can manage anyone
  if (managerRole === 'super_admin') return true;

  // Can't manage someone with equal or higher role level
  if (ROLE_LEVELS[targetRole] >= ROLE_LEVELS[managerRole]) return false;

  // Check if the target is a direct subordinate
  return targetSupervisorId === managerId;
}

/**
 * Check if a user can view another user's data
 */
export function canViewUser(
  viewerRole: EmployeeRole,
  viewerId: string,
  targetId: string,
  targetSupervisorId: string | null
): boolean {
  // Can always view own data
  if (viewerId === targetId) return true;

  // Super admin can view anyone
  if (viewerRole === 'super_admin') return true;

  // Check if viewer is the supervisor
  if (targetSupervisorId === viewerId) {
    return ['manager', 'leader'].includes(viewerRole);
  }

  return false;
}

/**
 * Get accessible menu items based on role
 */
export function getAccessibleMenuItems(role: EmployeeRole) {
  const menuItems = {
    dashboard: true, // Everyone can see dashboard
    reviews: true, // Everyone can see their reviews
    employees: ['super_admin', 'manager', 'leader'].includes(role),
    templates: ['super_admin', 'manager'].includes(role),
    departments: ['super_admin', 'manager'].includes(role),
    reports: ['super_admin', 'manager', 'leader'].includes(role),
    settings: ['super_admin', 'manager'].includes(role),
    reviewPeriods: role === 'super_admin',
  };

  return menuItems;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: EmployeeRole): string {
  const displayNames: Record<EmployeeRole, string> = {
    super_admin: 'Super Admin',
    manager: 'Manager',
    leader: 'Team Leader',
    employee: 'Employee',
  };

  return displayNames[role];
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: EmployeeRole): string {
  const colors: Record<EmployeeRole, string> = {
    super_admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    leader: 'bg-green-100 text-green-800',
    employee: 'bg-gray-100 text-gray-800',
  };

  return colors[role];
}

/**
 * Check if a user can be assigned as supervisor for another user
 */
export function canBeAssignedAsSupervisor(
  supervisorRole: EmployeeRole,
  subordinateRole: EmployeeRole
): boolean {
  // Super admin cannot have a supervisor
  if (subordinateRole === 'super_admin') return false;

  // Check role hierarchy
  return ROLE_LEVELS[supervisorRole] > ROLE_LEVELS[subordinateRole];
}

/**
 * Get valid supervisor roles for a given role
 */
export function getValidSupervisorRoles(role: EmployeeRole): EmployeeRole[] {
  switch (role) {
    case 'super_admin':
      return []; // No one can supervise super admin
    case 'manager':
      return ['super_admin', 'manager']; // Can be supervised by super admin or another manager
    case 'leader':
      return ['super_admin', 'manager']; // Can be supervised by super admin or manager
    case 'employee':
      return ['super_admin', 'manager', 'leader']; // Can be supervised by anyone except employee
    default:
      return [];
  }
}

/**
 * Filter employees list based on viewer's role and permissions
 */
export function filterEmployeesByPermission(
  employees: any[],
  viewerRole: EmployeeRole,
  viewerId: string
): any[] {
  if (viewerRole === 'super_admin') {
    return employees; // Super admin sees everyone
  }

  if (viewerRole === 'manager' || viewerRole === 'leader') {
    // See direct subordinates and their subordinates recursively
    const getSubordinates = (supervisorId: string): any[] => {
      const directSubordinates = employees.filter(e => e.supervisorId === supervisorId);
      const allSubordinates = [...directSubordinates];

      directSubordinates.forEach(sub => {
        allSubordinates.push(...getSubordinates(sub.id));
      });

      return allSubordinates;
    };

    return getSubordinates(viewerId);
  }

  // Employees only see themselves
  return employees.filter(e => e.id === viewerId);
}

/**
 * Check if user can create/edit review periods
 */
export function canManageReviewPeriods(role: EmployeeRole): boolean {
  return role === 'super_admin';
}

/**
 * Check if user can export data
 */
export function canExportData(role: EmployeeRole): boolean {
  return ['super_admin', 'manager'].includes(role);
}

/**
 * Check if user can send bulk notifications
 */
export function canSendBulkNotifications(role: EmployeeRole): boolean {
  return role === 'super_admin';
}

/**
 * Get dashboard data scope based on role
 */
export function getDashboardDataScope(role: EmployeeRole): 'all' | 'team' | 'self' {
  switch (role) {
    case 'super_admin':
      return 'all';
    case 'manager':
    case 'leader':
      return 'team';
    case 'employee':
      return 'self';
    default:
      return 'self';
  }
}