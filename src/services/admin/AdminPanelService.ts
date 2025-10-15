import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/lib/logging";

export interface DashboardMetric {
  id: string;
  metric_type: string;
  metric_value: number;
  trend_percentage: number;
}

export interface ModerationItem {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  created_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  admin_notes: string;
  warning_count: number;
  is_suspended: boolean;
  suspension_reason?: string;
}

class AdminPanelService {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetric[]> {
    try {
      const { data, error } = await supabase
        .from("admin_dashboard_metrics")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError("Error fetching dashboard metrics", error as Error);
      throw error;
    }
  }

  /**
   * Record metric
   */
  async recordMetric(
    metricType: string,
    value: number,
    previousValue?: number
  ): Promise<void> {
    try {
      const trendPercentage = previousValue 
        ? ((value - previousValue) / previousValue) * 100 
        : 0;

      const { error } = await supabase
        .from("admin_dashboard_metrics")
        .insert({
          metric_type: metricType,
          metric_value: value,
          previous_value: previousValue,
          trend_percentage: trendPercentage
        });

      if (error) throw error;

      logInfo(`Metric recorded: ${metricType} = ${value}`);
    } catch (error) {
      logError("Error recording metric", error as Error);
      throw error;
    }
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(status?: string): Promise<ModerationItem[]> {
    try {
      let query = supabase
        .from("content_moderation_queue")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logError("Error fetching moderation queue", error as Error);
      throw error;
    }
  }

  /**
   * Moderate content
   */
  async moderateContent(
    contentId: string,
    decision: 'approved' | 'rejected' | 'flagged',
    notes: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("content_moderation_queue")
        .update({
          status: decision,
          admin_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", contentId);

      if (error) throw error;

      logInfo(`Content moderated: ${contentId} - ${decision}`);
    } catch (error) {
      logError("Error moderating content", error as Error);
      throw error;
    }
  }

  /**
   * Get user management
   */
  async getUserManagement(userId: string): Promise<AdminUser | null> {
    try {
      const { data, error } = await supabase
        .from("admin_user_management")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      logError(`Error fetching user management for ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(
    userId: string,
    reason: string,
    suspendUntil?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("admin_user_management")
        .upsert({
          user_id: userId,
          is_suspended: true,
          suspension_reason: reason,
          suspension_until: suspendUntil
        });

      if (error) throw error;

      logInfo(`User suspended: ${userId} - Reason: ${reason}`);
    } catch (error) {
      logError("Error suspending user", error as Error);
      throw error;
    }
  }

  /**
   * Unsuspend user
   */
  async unsuspendUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("admin_user_management")
        .update({ is_suspended: false })
        .eq("user_id", userId);

      if (error) throw error;

      logInfo(`User unsuspended: ${userId}`);
    } catch (error) {
      logError("Error unsuspending user", error as Error);
      throw error;
    }
  }

  /**
   * Add admin note
   */
  async addAdminNote(userId: string, note: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("admin_user_management")
        .upsert({
          user_id: userId,
          admin_notes: note
        });

      if (error) throw error;

      logInfo(`Admin note added for user ${userId}`);
    } catch (error) {
      logError("Error adding admin note", error as Error);
      throw error;
    }
  }

  /**
   * Get content management items
   */
  async getContentItems(contentType?: string, status?: string): Promise<any[]> {
    try {
      let query = supabase
        .from("admin_content_management")
        .select("*")
        .order("created_at", { ascending: false });

      if (contentType) {
        query = query.eq("content_type", contentType);
      }
      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logError("Error fetching content items", error as Error);
      throw error;
    }
  }

  /**
   * Feature content
   */
  async featureContent(contentId: string, position: number, until?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("admin_content_management")
        .update({
          is_featured: true,
          feature_position: position,
          featured_until: until
        })
        .eq("id", contentId);

      if (error) throw error;

      logInfo(`Content featured: ${contentId} at position ${position}`);
    } catch (error) {
      logError("Error featuring content", error as Error);
      throw error;
    }
  }

  /**
   * Unfeature content
   */
  async unfeatureContent(contentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("admin_content_management")
        .update({ is_featured: false })
        .eq("id", contentId);

      if (error) throw error;

      logInfo(`Content unfeatured: ${contentId}`);
    } catch (error) {
      logError("Error unfeaturing content", error as Error);
      throw error;
    }
  }

  /**
   * Get audit log
   */
  async getAuditLog(limit = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError("Error fetching audit log", error as Error);
      throw error;
    }
  }

  /**
   * Log admin action
   */
  async logAction(
    adminUserId: string,
    action: string,
    targetType: string,
    targetId: string,
    changes?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("admin_audit_log")
        .insert({
          admin_user_id: adminUserId,
          action,
          target_type: targetType,
          target_id: targetId,
          changes: changes || {}
        });

      if (error) throw error;

      logInfo(`Admin action logged: ${action} on ${targetType} ${targetId}`);
    } catch (error) {
      logError("Error logging admin action", error as Error);
      throw error;
    }
  }

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("admin_system_settings")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;

      const settings: any = {};
      (data || []).forEach(item => {
        settings[item.setting_key] = item.setting_value;
      });

      return settings;
    } catch (error) {
      logError("Error fetching system settings", error as Error);
      throw error;
    }
  }

  /**
   * Update system setting
   */
  async updateSystemSetting(key: string, value: any, description?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("admin_system_settings")
        .upsert({
          setting_key: key,
          setting_value: value,
          description: description || ""
        });

      if (error) throw error;

      logInfo(`System setting updated: ${key}`);
    } catch (error) {
      logError("Error updating system setting", error as Error);
      throw error;
    }
  }

  /**
   * Send admin communication
   */
  async sendCommunication(
    communicationType: string,
    title: string,
    message: string,
    targetUsers: string,
    scheduledFor?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("admin_communications")
        .insert({
          communication_type: communicationType,
          title,
          message,
          target_users: targetUsers,
          scheduled_for: scheduledFor
        });

      if (error) throw error;

      logInfo(`Communication sent: ${title} to ${targetUsers}`);
    } catch (error) {
      logError("Error sending communication", error as Error);
      throw error;
    }
  }

  /**
   * Get bulk operations
   */
  async getBulkOperations(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("admin_bulk_operations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError("Error fetching bulk operations", error as Error);
      throw error;
    }
  }

  /**
   * Create bulk operation
   */
  async createBulkOperation(
    operationType: string,
    totalCount: number,
    performedBy: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("admin_bulk_operations")
        .insert({
          operation_type: operationType,
          total_count: totalCount,
          performed_by: performedBy,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Bulk operation created: ${operationType}`);
      return data.id;
    } catch (error) {
      logError("Error creating bulk operation", error as Error);
      throw error;
    }
  }

  /**
   * Update bulk operation status
   */
  async updateBulkOperationStatus(
    operationId: string,
    status: string,
    successfulCount: number,
    failedCount: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("admin_bulk_operations")
        .update({
          status,
          successful_count: successfulCount,
          failed_count: failedCount,
          completed_at: status === "completed" ? new Date().toISOString() : null
        })
        .eq("id", operationId);

      if (error) throw error;

      logInfo(`Bulk operation updated: ${operationId} - ${status}`);
    } catch (error) {
      logError("Error updating bulk operation", error as Error);
      throw error;
    }
  }
}

export const adminPanelService = new AdminPanelService();
