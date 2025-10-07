export type UserRole = 'ADMIN' | 'MODERATOR';

export interface UserPermissions {
  canViewHistory: boolean;
  canViewLiveSessions: boolean;
  canManageSettings: boolean;
  canManageContent: boolean;
  canManageCommunity: boolean;
}

export const RolePermissions: Record<UserRole, UserPermissions> = {
  ADMIN: {
    canViewHistory: true,
    canViewLiveSessions: true,
    canManageSettings: true,
    canManageContent: true,
    canManageCommunity: true,
  },
  MODERATOR: {
    canViewHistory: false,
    canViewLiveSessions: false,
    canManageSettings: true,
    canManageContent: true,
    canManageCommunity: true,
  },
};
