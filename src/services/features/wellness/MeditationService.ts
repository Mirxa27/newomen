import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Meditation = Database["public"]["Tables"]["meditations"]["Row"];
export type MeditationRecipe = Database["public"]["Tables"]["meditation_recipes"]["Row"];
export type UserMeditationProgress = Database["public"]["Tables"]["user_meditation_progress"]["Row"];
export type MeditationSession = Database["public"]["Tables"]["meditation_sessions"]["Row"];

export class MeditationService {
  // ===== Meditation Library =====
  
  static async getMeditations(category?: string, limit: number = 20, offset: number = 0) {
    try {
      let query = supabase.from("meditations").select("*");
      
      if (category) {
        query = query.eq("category", category);
      }
      
      const { data, error } = await query
        .order("view_count", { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching meditations:", error);
      throw error;
    }
  }

  static async getMeditationById(id: string) {
    try {
      const { data, error } = await supabase
        .from("meditations")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching meditation:", error);
      throw error;
    }
  }

  static async searchMeditations(query: string) {
    try {
      const { data, error } = await supabase
        .from("meditations")
        .select("*")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(20);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error searching meditations:", error);
      throw error;
    }
  }

  static async getMeditationsByBenefit(benefit: string) {
    try {
      const { data, error } = await supabase
        .from("meditations")
        .select("*")
        .contains("target_benefits", [benefit]);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching meditations by benefit:", error);
      throw error;
    }
  }

  // ===== Meditation Recipes =====

  static async getMeditationRecipes(limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from("meditation_recipes")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("view_count", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching meditation recipes:", error);
      throw error;
    }
  }

  static async getMeditationRecipeById(id: string) {
    try {
      const { data, error } = await supabase
        .from("meditation_recipes")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching meditation recipe:", error);
      throw error;
    }
  }

  static async getMeditationRecipesByCategory(situation: string) {
    try {
      const { data, error } = await supabase
        .from("meditation_recipes")
        .select("*")
        .ilike("for_situation", `%${situation}%`);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching meditation recipes by category:", error);
      throw error;
    }
  }

  // ===== User Meditation Progress =====

  static async getUserMeditationProgress(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_meditation_progress")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching user meditation progress:", error);
      throw error;
    }
  }

  static async logMeditationSession(meditationId: string, durationSeconds: number, userId: string, completed: boolean = true) {
    try {
      // Create session record
      const { error: sessionError } = await supabase
        .from("meditation_sessions")
        .insert({
          meditation_id: meditationId,
          duration_seconds: durationSeconds,
          user_id: userId,
          completed,
        });
      
      if (sessionError) throw sessionError;

      // Update or create progress record
      const { data: existingProgress, error: fetchError } = await supabase
        .from("user_meditation_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("meditation_id", meditationId)
        .single();
      
      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      if (existingProgress) {
        const { error: updateError } = await supabase
          .from("user_meditation_progress")
          .update({
            completed_count: existingProgress.completed_count + 1,
            total_minutes_spent: existingProgress.total_minutes_spent + Math.ceil(durationSeconds / 60),
            last_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProgress.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("user_meditation_progress")
          .insert({
            user_id: userId,
            meditation_id: meditationId,
            completed_count: 1,
            total_minutes_spent: Math.ceil(durationSeconds / 60),
            last_completed_at: new Date().toISOString(),
          });
        
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error logging meditation session:", error);
      throw error;
    }
  }

  static async favoriteMeditation(userId: string, meditationId: string, favorited: boolean) {
    try {
      const { data: existingProgress, error: fetchError } = await supabase
        .from("user_meditation_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("meditation_id", meditationId)
        .single();
      
      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      if (existingProgress) {
        const { error: updateError } = await supabase
          .from("user_meditation_progress")
          .update({ favorited, updated_at: new Date().toISOString() })
          .eq("id", existingProgress.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("user_meditation_progress")
          .insert({
            user_id: userId,
            meditation_id: meditationId,
            favorited,
          });
        
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error updating meditation favorite status:", error);
      throw error;
    }
  }

  static async rateMeditation(userId: string, meditationId: string, rating: number) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      const { data: existingProgress, error: fetchError } = await supabase
        .from("user_meditation_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("meditation_id", meditationId)
        .single();
      
      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      if (existingProgress) {
        const { error: updateError } = await supabase
          .from("user_meditation_progress")
          .update({ rating, updated_at: new Date().toISOString() })
          .eq("id", existingProgress.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("user_meditation_progress")
          .insert({
            user_id: userId,
            meditation_id: meditationId,
            rating,
          });
        
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error rating meditation:", error);
      throw error;
    }
  }

  static async getFavoriteMeditations(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_meditation_progress")
        .select("meditation_id, meditations(*)")
        .eq("user_id", userId)
        .eq("favorited", true);
      
      if (error) throw error;
      return data?.map(p => p.meditations) || [];
    } catch (error) {
      console.error("Error fetching favorite meditations:", error);
      throw error;
    }
  }

  static async getMeditationStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_meditation_progress")
        .select("completed_count, total_minutes_spent")
        .eq("user_id", userId);
      
      if (error) throw error;

      const stats = {
        totalSessions: 0,
        totalMinutes: 0,
        uniqueMeditations: data?.length || 0,
      };

      data?.forEach(item => {
        stats.totalSessions += item.completed_count;
        stats.totalMinutes += item.total_minutes_spent;
      });

      return stats;
    } catch (error) {
      console.error("Error fetching meditation stats:", error);
      throw error;
    }
  }

  // ===== Meditation Library Management (Admin) =====

  static async createMeditation(meditation: Omit<Meditation, "id" | "created_at" | "updated_at">) {
    try {
      const { data, error } = await supabase
        .from("meditations")
        .insert(meditation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating meditation:", error);
      throw error;
    }
  }

  static async updateMeditation(id: string, updates: Partial<Meditation>) {
    try {
      const { data, error } = await supabase
        .from("meditations")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating meditation:", error);
      throw error;
    }
  }

  static async incrementMeditationViewCount(id: string) {
    try {
      const { error } = await supabase.rpc("increment_meditation_views", { meditation_id: id });
      if (error) throw error;
    } catch (error) {
      console.error("Error incrementing meditation view count:", error);
      // Don't throw - this is not critical
    }
  }
}
