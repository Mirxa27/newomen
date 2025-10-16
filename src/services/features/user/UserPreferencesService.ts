import { supabase } from "@/integrations/supabase/client";

export interface UserPreferences {
  enable_email_notifications?: boolean;
  enable_achievement_notifications?: boolean;
  enable_weekly_report?: boolean;
  enable_marketing_emails?: boolean;
  profile_is_public?: boolean;
  show_activity_status?: boolean;
  allow_ai_data_sharing?: boolean;
}

export class UserPreferencesService {
  static async getPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data?.preferences as UserPreferences || {};
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  static async updatePreferences(userId: string, prefs: UserPreferences): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ preferences: prefs, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }
}


