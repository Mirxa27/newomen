import { supabase } from '@/integrations/supabase/client';

export interface AdminAccessResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin' | 'moderator' | 'superadmin';
    user_id: string;
  };
  error?: string;
}

/**
 * AdminAccessService - Manage admin role assignments
 * Used to grant or revoke admin access to users
 */
export class AdminAccessService {
  /**
   * Grant admin access to a user by email
   * @param email The user's email address
   * @returns Result object with success status and details
   */
  static async grantAdminAccess(email: string): Promise<AdminAccessResult> {
    console.log(`🔐 Granting admin access to: ${email}`);

    try {
      // Step 1: Find the user
      console.log('Step 1: Locating user...');
      const { data: user, error: findError } = await supabase
        .from('user_profiles')
        .select('id, email, role, user_id')
        .ilike('email', email)
        .single();

      if (findError || !user) {
        console.error('❌ User not found:', findError?.message);
        return {
          success: false,
          message: `User with email "${email}" not found in system`,
          error: findError?.message || 'User not found'
        };
      }

      console.log(`✅ User found: ${user.email} (current role: ${user.role})`);

      // Step 2: Update role to admin
      console.log('Step 2: Updating role to admin...');
      const { data: updated, error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select('id, email, role, user_id')
        .single();

      if (updateError) {
        console.error('❌ Update failed:', updateError.message);
        return {
          success: false,
          message: 'Failed to update user role',
          error: updateError.message
        };
      }

      console.log(`✅ Role updated: ${updated.email} → admin`);

      // Step 3: Verify the change
      console.log('Step 3: Verifying admin access...');
      const { data: verified, error: verifyError } = await supabase
        .from('user_profiles')
        .select('id, email, role, user_id')
        .eq('id', user.id)
        .single();

      if (verifyError || !verified) {
        console.error('❌ Verification failed:', verifyError?.message);
        return {
          success: false,
          message: 'Failed to verify admin access',
          error: verifyError?.message
        };
      }

      if (verified.role !== 'admin') {
        console.error('❌ Role not updated to admin');
        return {
          success: false,
          message: `Role update failed. Current role: ${verified.role}`,
          error: 'Role not updated'
        };
      }

      console.log(`✨ SUCCESS! ${verified.email} now has admin access`);
      return {
        success: true,
        message: `Admin access granted to ${verified.email}`,
        user: verified
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Unexpected error:', errorMessage);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error: errorMessage
      };
    }
  }

  /**
   * Revoke admin access from a user
   * @param email The user's email address
   * @returns Result object with success status
   */
  static async revokeAdminAccess(email: string): Promise<AdminAccessResult> {
    console.log(`🔓 Revoking admin access from: ${email}`);

    try {
      // Find the user
      const { data: user, error: findError } = await supabase
        .from('user_profiles')
        .select('id, email, role, user_id')
        .ilike('email', email)
        .single();

      if (findError || !user) {
        return {
          success: false,
          message: `User with email "${email}" not found`,
          error: findError?.message
        };
      }

      if (user.role !== 'admin') {
        return {
          success: false,
          message: `User is not an admin (current role: ${user.role})`,
        };
      }

      // Update role back to user
      const { data: updated, error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'user' })
        .eq('id', user.id)
        .select('id, email, role, user_id')
        .single();

      if (updateError) {
        return {
          success: false,
          message: 'Failed to revoke admin access',
          error: updateError.message
        };
      }

      return {
        success: true,
        message: `Admin access revoked from ${updated.email}`,
        user: updated
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error: errorMessage
      };
    }
  }

  /**
   * Check if a user is an admin
   * @param email The user's email address
   * @returns true if user is admin, false otherwise
   */
  static async isUserAdmin(email: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('role')
        .ilike('email', email)
        .single();

      if (error || !user) return false;
      return user.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get all admin users
   * @returns Array of admin users
   */
  static async getAllAdmins() {
    try {
      const { data: admins, error } = await supabase
        .from('user_profiles')
        .select('id, email, role, user_id, created_at')
        .in('role', ['admin', 'superadmin', 'moderator'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admins:', error);
        return [];
      }

      return admins || [];
    } catch (error) {
      console.error('Error fetching admins:', error);
      return [];
    }
  }

  /**
   * Grant moderator access (limited admin access)
   * @param email The user's email address
   * @returns Result object with success status and details
   */
  static async grantModeratorAccess(email: string): Promise<AdminAccessResult> {
    console.log(`🔐 Granting moderator access to: ${email}`);

    try {
      // Step 1: Find the user
      const { data: user, error: findError } = await supabase
        .from('user_profiles')
        .select('id, email, role, user_id')
        .ilike('email', email)
        .single();

      if (findError || !user) {
        return {
          success: false,
          message: `User with email "${email}" not found in system`,
          error: findError?.message || 'User not found'
        };
      }

      // Step 2: Update role to moderator
      const { data: updated, error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'moderator' })
        .eq('id', user.id)
        .select('id, email, role, user_id')
        .single();

      if (updateError) {
        return {
          success: false,
          message: 'Failed to update user role',
          error: updateError.message
        };
      }

      // Step 3: Verify the change
      const { data: verified, error: verifyError } = await supabase
        .from('user_profiles')
        .select('id, email, role, user_id')
        .eq('id', user.id)
        .single();

      if (verifyError || !verified || verified.role !== 'moderator') {
        return {
          success: false,
          message: 'Failed to verify moderator access',
          error: verifyError?.message
        };
      }

      console.log(`✨ SUCCESS! ${verified.email} now has moderator access`);
      return {
        success: true,
        message: `Moderator access granted to ${verified.email}`,
        user: verified
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error: errorMessage
      };
    }
  }

  /**
   * Setup the database constraint to support all roles including superadmin
   * This should be run once during setup
   */
  static async setupRoleConstraint(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔧 Setting up role constraints...');
      
      // This would need to be executed as a migration via Supabase SQL editor
      const migration = `
        -- Add 'superadmin' role to user_profiles role constraint
        ALTER TABLE public.user_profiles 
        DROP CONSTRAINT IF EXISTS user_profiles_role_check;

        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_role_check 
        CHECK (role IN ('user', 'admin', 'moderator', 'superadmin'));

        -- Update admin@newomen.me to superadmin role (if exists)
        UPDATE public.user_profiles 
        SET role = 'superadmin' 
        WHERE email = 'admin@newomen.me';
      `;

      return {
        success: true,
        message: 'Please execute this migration in Supabase SQL Editor:\n' + migration
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to setup role constraint'
      };
    }
  }
}

export default AdminAccessService;
