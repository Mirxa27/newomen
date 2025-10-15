/**
 * Temporary admin bypass for development/testing
 * This allows admin functions to work without proper authentication
 */

export const ADMIN_BYPASS_MODE = true; // Set to false in production

export function isAdminBypass(): boolean {
  return ADMIN_BYPASS_MODE;
}

export function getAdminUserId(): string {
  // Return the admin user ID for bypass mode
  return '62dab7d5-2c43-4838-b2d7-7e76492894cf';
}

export function checkAdminAccess(): boolean {
  if (ADMIN_BYPASS_MODE) {
    return true;
  }
  
  // In production, this would check actual authentication
  return false;
}
