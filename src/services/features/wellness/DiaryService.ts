import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type GratitudeEntry = Database["public"]["Tables"]["gratitude_diary_entries"]["Row"];
export type StateEntry = Database["public"]["Tables"]["state_diary_entries"]["Row"];
export type ProgressEntry = Database["public"]["Tables"]["progress_diary_entries"]["Row"];

export class DiaryService {
  // ===== Gratitude Diary =====

  static async createGratitudeEntry(userId: string, entry: Omit<GratitudeEntry, "id" | "created_at" | "updated_at">) {
    try {
      const { data, error } = await supabase
        .from("gratitude_diary_entries")
        .insert({ user_id: userId, ...entry })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating gratitude entry:", error);
      throw error;
    }
  }

  static async getUserGratitudeEntries(userId: string, limit: number = 30) {
    try {
      const { data, error } = await supabase
        .from("gratitude_diary_entries")
        .select("*")
        .eq("user_id", userId)
        .order("entry_date", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching gratitude entries:", error);
      throw error;
    }
  }

  static async getGratitudeEntriesByDate(userId: string, startDate: Date, endDate: Date) {
    try {
      const start = startDate.toISOString().split("T")[0];
      const end = endDate.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("gratitude_diary_entries")
        .select("*")
        .eq("user_id", userId)
        .gte("entry_date", start)
        .lte("entry_date", end)
        .order("entry_date", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching gratitude entries by date:", error);
      throw error;
    }
  }

  static async updateGratitudeEntry(entryId: string, updates: Partial<GratitudeEntry>) {
    try {
      const { data, error } = await supabase
        .from("gratitude_diary_entries")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", entryId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating gratitude entry:", error);
      throw error;
    }
  }

  static async deleteGratitudeEntry(entryId: string) {
    try {
      const { error } = await supabase
        .from("gratitude_diary_entries")
        .delete()
        .eq("id", entryId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting gratitude entry:", error);
      throw error;
    }
  }

  // ===== State Diary =====

  static async createStateEntry(userId: string, entry: Omit<StateEntry, "id" | "created_at" | "updated_at">) {
    try {
      const { data, error } = await supabase
        .from("state_diary_entries")
        .insert({ user_id: userId, ...entry })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating state entry:", error);
      throw error;
    }
  }

  static async getUserStateEntries(userId: string, limit: number = 30) {
    try {
      const { data, error } = await supabase
        .from("state_diary_entries")
        .select("*")
        .eq("user_id", userId)
        .order("entry_date", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching state entries:", error);
      throw error;
    }
  }

  static async getStateEntriesByDate(userId: string, startDate: Date, endDate: Date) {
    try {
      const start = startDate.toISOString().split("T")[0];
      const end = endDate.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("state_diary_entries")
        .select("*")
        .eq("user_id", userId)
        .gte("entry_date", start)
        .lte("entry_date", end)
        .order("entry_date", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching state entries by date:", error);
      throw error;
    }
  }

  static async updateStateEntry(entryId: string, updates: Partial<StateEntry>) {
    try {
      const { data, error } = await supabase
        .from("state_diary_entries")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", entryId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating state entry:", error);
      throw error;
    }
  }

  static async deleteStateEntry(entryId: string) {
    try {
      const { error } = await supabase
        .from("state_diary_entries")
        .delete()
        .eq("id", entryId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting state entry:", error);
      throw error;
    }
  }

  // ===== Progress Diary =====

  static async createProgressEntry(userId: string, entry: Omit<ProgressEntry, "id" | "created_at">) {
    try {
      const { data, error } = await supabase
        .from("progress_diary_entries")
        .insert({ user_id: userId, ...entry })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating progress entry:", error);
      throw error;
    }
  }

  static async getUserProgressEntries(userId: string, limit: number = 30) {
    try {
      const { data, error } = await supabase
        .from("progress_diary_entries")
        .select("*")
        .eq("user_id", userId)
        .order("entry_date", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching progress entries:", error);
      throw error;
    }
  }

  static async getProgressEntriesByDate(userId: string, startDate: Date, endDate: Date) {
    try {
      const start = startDate.toISOString().split("T")[0];
      const end = endDate.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("progress_diary_entries")
        .select("*")
        .eq("user_id", userId)
        .gte("entry_date", start)
        .lte("entry_date", end)
        .order("entry_date", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching progress entries by date:", error);
      throw error;
    }
  }

  static async deleteProgressEntry(entryId: string) {
    try {
      const { error } = await supabase
        .from("progress_diary_entries")
        .delete()
        .eq("id", entryId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting progress entry:", error);
      throw error;
    }
  }

  // ===== Statistics =====

  static async getUserDiaryStats(userId: string) {
    try {
      const [gratitudeEntries, stateEntries, progressEntries] = await Promise.all([
        this.getUserGratitudeEntries(userId, 1000),
        this.getUserStateEntries(userId, 1000),
        this.getUserProgressEntries(userId, 1000),
      ]);

      // Calculate average mood
      let avgMood = 0;
      if (gratitudeEntries.length > 0) {
        const totalMood = gratitudeEntries.reduce((sum, entry) => sum + (entry.mood_score || 0), 0);
        avgMood = totalMood / gratitudeEntries.length;
      }

      // Calculate average energy and clarity
      let avgEnergy = 0;
      let avgClarity = 0;
      if (stateEntries.length > 0) {
        const totalEnergy = stateEntries.reduce((sum, entry) => sum + (entry.energy_level || 0), 0);
        const totalClarity = stateEntries.reduce((sum, entry) => sum + (entry.clarity_level || 0), 0);
        avgEnergy = totalEnergy / stateEntries.length;
        avgClarity = totalClarity / stateEntries.length;
      }

      return {
        totalGratitudeEntries: gratitudeEntries.length,
        totalStateEntries: stateEntries.length,
        totalProgressEntries: progressEntries.length,
        averageMood: avgMood.toFixed(1),
        averageEnergy: avgEnergy.toFixed(1),
        averageClarity: avgClarity.toFixed(1),
      };
    } catch (error) {
      console.error("Error fetching diary stats:", error);
      throw error;
    }
  }
}
