/**
 * User role types and permissions for role-based access control
 */

export type UserRole = 'ADMIN' | 'MODERATOR' | 'PARTICIPANT';

export interface UserPermissions {
  canManageUsers: boolean;
  canManageContent: boolean;
  canManageSettings: boolean;
  canViewAnalytics: boolean;
  canModerateContent: boolean;
  canAccessAdminPanel: boolean;
}

export const RolePermissions: Record<UserRole, UserPermissions> = {
  ADMIN: {
    canManageUsers: true,
    canManageContent: true,
    canManageSettings: true,
    canViewAnalytics: true,
    canModerateContent: true,
    canAccessAdminPanel: true,
  },
  MODERATOR: {
    canManageUsers: false,
    canManageContent: true,
    canManageSettings: false,
    canViewAnalytics: true,
    canModerateContent: true,
    canAccessAdminPanel: true,
  },
  PARTICIPANT: {
    canManageUsers: false,
    canManageContent: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canModerateContent: false,
    canAccessAdminPanel: false,
  },
};
