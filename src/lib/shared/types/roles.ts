export type UserRole = 'superadmin' | 'admin' | 'moderator' | 'user';

export interface UserPermissions {
  canViewHistory: boolean;
  canViewLiveSessions: boolean;
  canManageSettings: boolean;
  canManageContent: boolean;
  canManageCommunity: boolean;
  canManageUsers: boolean;
  canManageAPIs: boolean;
  canViewAnalytics: boolean;
  canManageAIProviders: boolean;
  canManageAssessments: boolean;
}

export const RolePermissions: Record<UserRole, UserPermissions> = {
  superadmin: {
    canViewHistory: true,
    canViewLiveSessions: true,
    canManageSettings: true,
    canManageContent: true,
    canManageCommunity: true,
    canManageUsers: true,
    canManageAPIs: true,
    canViewAnalytics: true,
    canManageAIProviders: true,
    canManageAssessments: true,
  },
  admin: {
    canViewHistory: true,
    canViewLiveSessions: true,
    canManageSettings: true,
    canManageContent: true,
    canManageCommunity: true,
    canManageUsers: true,
    canManageAPIs: false,
    canViewAnalytics: true,
    canManageAIProviders: true,
    canManageAssessments: true,
  },
  moderator: {
    canViewHistory: false,
    canViewLiveSessions: false,
    canManageSettings: false,
    canManageContent: true,
    canManageCommunity: true,
    canManageUsers: false,
    canManageAPIs: false,
    canViewAnalytics: false,
    canManageAIProviders: false,
    canManageAssessments: true, // Allow access to AI Assessments
  },
  user: {
    canViewHistory: false,
    canViewLiveSessions: false,
    canManageSettings: false,
    canManageContent: false,
    canManageCommunity: false,
    canManageUsers: false,
    canManageAPIs: false,
    canViewAnalytics: false,
    canManageAIProviders: false,
    canManageAssessments: false,
  },
};
