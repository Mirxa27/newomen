import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DailyAffirmation = Database["public"]["Tables"]["affirmations"]["Row"];
export type UserAffirmationSettings = Database["public"]["Tables"]["user_affirmation_settings"]["Row"];

export class AffirmationService {
  static async getDailyAffirmations(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from("affirmations")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching daily affirmations:", error);
      throw error;
    }
  }

  static async getAffirmationsByCategory(category: string) {
    try {
      const { data, error } = await supabase
        .from("daily_affirmations")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching affirmations by category:", error);
      throw error;
    }
  }

  static async getTodaysAffirmation() {
    try {
      // Get a random affirmation for today
      const { data, error } = await supabase
        .from("affirmations")
        .select("*")
        .eq("is_active", true)
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return data[Math.floor(Math.random() * data.length)];
      }
      return null;
    } catch (error) {
      console.error("Error fetching today's affirmation:", error);
      throw error;
    }
  }

  static async getUserAffirmationSettings(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_affirmation_settings")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    } catch (error) {
      console.error("Error fetching user affirmation settings:", error);
      throw error;
    }
  }

  static async createOrUpdateAffirmationSettings(userId: string, settings: Partial<UserAffirmationSettings>) {
    try {
      const existing = await this.getUserAffirmationSettings(userId);
      
      if (existing) {
        const { data, error } = await supabase
          .from("user_affirmation_settings")
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("user_affirmation_settings")
          .insert({
            user_id: userId,
            ...settings,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error("Error creating/updating affirmation settings:", error);
      throw error;
    }
  }

  static async updateAffirmationTime(userId: string, time: string) {
    try {
      return await this.createOrUpdateAffirmationSettings(userId, { preferred_time: time });
    } catch (error) {
      console.error("Error updating affirmation time:", error);
      throw error;
    }
  }

  static async toggleAffirmationNotifications(userId: string, enabled: boolean) {
    try {
      return await this.createOrUpdateAffirmationSettings(userId, { allow_notifications: enabled });
    } catch (error) {
      console.error("Error toggling affirmation notifications:", error);
      throw error;
    }
  }

  static async enableWallpaperAffirmations(userId: string, enabled: boolean) {
    try {
      return await this.createOrUpdateAffirmationSettings(userId, { enable_wallpaper: enabled });
    } catch (error) {
      console.error("Error enabling wallpaper affirmations:", error);
      throw error;
    }
  }

  static async updateAffirmationCategories(userId: string, categories: string[]) {
    try {
      return await this.createOrUpdateAffirmationSettings(userId, { selected_categories: categories });
    } catch (error) {
      console.error("Error updating affirmation categories:", error);
      throw error;
    }
  }

  static async getRandomAffirmation(category?: string) {
    try {
      let query = supabase
        .from("daily_affirmations")
        .select("*")
        .eq("is_active", true);
      
      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return data[Math.floor(Math.random() * data.length)];
      }
      return null;
    } catch (error) {
      console.error("Error fetching random affirmation:", error);
      throw error;
    }
  }

  // Admin methods
  static async createAffirmation(affirmation: Omit<DailyAffirmation, "id" | "created_at">) {
    try {
      const { data, error } = await supabase
        .from("daily_affirmations")
        .insert(affirmation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating affirmation:", error);
      throw error;
    }
  }

  static async updateAffirmation(id: string, updates: Partial<DailyAffirmation>) {
    try {
      const { data, error } = await supabase
        .from("daily_affirmations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating affirmation:", error);
      throw error;
    }
  }

  static async deleteAffirmation(id: string) {
    try {
      const { error } = await supabase
        .from("daily_affirmations")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting affirmation:", error);
      throw error;
    }
  }
}
