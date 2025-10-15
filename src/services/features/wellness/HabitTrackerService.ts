import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Habit = Database["public"]["Tables"]["habits"]["Row"];
export type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];

export class HabitTrackerService {
  static async createHabit(userId: string, habit: Omit<Habit, "id" | "created_at" | "updated_at">) {
    try {
      const { data, error } = await supabase
        .from("habits")
        .insert({ user_id: userId, ...habit })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating habit:", error);
      throw error;
    }
  }

  static async getUserHabits(userId: string) {
    try {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching user habits:", error);
      throw error;
    }
  }

  static async getHabitById(habitId: string) {
    try {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("id", habitId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching habit:", error);
      throw error;
    }
  }

  static async updateHabit(habitId: string, updates: Partial<Habit>) {
    try {
      const { data, error } = await supabase
        .from("habits")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", habitId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating habit:", error);
      throw error;
    }
  }

  static async deleteHabit(habitId: string) {
    try {
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", habitId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting habit:", error);
      throw error;
    }
  }

  static async logHabitCompletion(habitId: string, userId: string, date: Date = new Date()) {
    try {
      const dateStr = date.toISOString().split("T")[0];

      // Check if already logged today
      const { data: existingLog, error: checkError } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("habit_id", habitId)
        .eq("user_id", userId)
        .eq("logged_date", dateStr)
        .single();
      
      if (checkError && checkError.code !== "PGRST116") throw checkError;

      if (existingLog) {
        // Update existing log
        const { data, error } = await supabase
          .from("habit_logs")
          .update({ completed_count: existingLog.completed_count + 1 })
          .eq("id", existingLog.id)
          .select()
          .single();
        
        if (error) throw error;
      } else {
        // Create new log
        const { data, error } = await supabase
          .from("habit_logs")
          .insert({
            habit_id: habitId,
            user_id: userId,
            logged_date: dateStr,
            completed_count: 1,
          })
          .select()
          .single();
        
        if (error) throw error;
      }

      // Update habit streak
      await this.updateStreakForHabit(habitId, userId);
    } catch (error) {
      console.error("Error logging habit completion:", error);
      throw error;
    }
  }

  static async getHabitLogs(habitId: string, userId: string, startDate?: Date, endDate?: Date) {
    try {
      let query = supabase
        .from("habit_logs")
        .select("*")
        .eq("habit_id", habitId)
        .eq("user_id", userId);
      
      if (startDate) {
        query = query.gte("logged_date", startDate.toISOString().split("T")[0]);
      }
      
      if (endDate) {
        query = query.lte("logged_date", endDate.toISOString().split("T")[0]);
      }

      const { data, error } = await query.order("logged_date", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching habit logs:", error);
      throw error;
    }
  }

  static async getHabitStreak(habitId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from("habit_logs")
        .select("logged_date")
        .eq("habit_id", habitId)
        .eq("user_id", userId)
        .order("logged_date", { ascending: false });
      
      if (error) throw error;

      if (!data || data.length === 0) return 0;

      // Calculate current streak
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < data.length; i++) {
        const logDate = new Date(data[i].logged_date);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);

        if (logDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error("Error calculating habit streak:", error);
      return 0;
    }
  }

  private static async updateStreakForHabit(habitId: string, userId: string) {
    try {
      const currentStreak = await this.getHabitStreak(habitId, userId);

      const { data: habit, error: fetchError } = await supabase
        .from("habits")
        .select("longest_streak")
        .eq("id", habitId)
        .single();
      
      if (fetchError) throw fetchError;

      const longestStreak = Math.max(currentStreak, habit?.longest_streak || 0);

      await supabase
        .from("habits")
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          updated_at: new Date().toISOString(),
        })
        .eq("id", habitId);
    } catch (error) {
      console.error("Error updating habit streak:", error);
      // Don't throw - streak update is not critical
    }
  }

  static async getHabitStats(userId: string) {
    try {
      const habits = await this.getUserHabits(userId);
      
      const stats = {
        totalHabits: habits.length,
        totalStreak: 0,
        averageCompletion: 0,
        habits: [] as any[],
      };

      for (const habit of habits) {
        const streak = await this.getHabitStreak(habit.id, userId);
        const logs = await this.getHabitLogs(habit.id, userId);
        
        stats.habits.push({
          id: habit.id,
          title: habit.title,
          currentStreak: streak,
          longestStreak: habit.longest_streak,
          completions: logs.length,
        });
        
        stats.totalStreak += streak;
      }

      if (habits.length > 0) {
        stats.averageCompletion = stats.totalStreak / habits.length;
      }

      return stats;
    } catch (error) {
      console.error("Error fetching habit stats:", error);
      throw error;
    }
  }

  static async getHabitsByCategory(userId: string, category: string) {
    try {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .eq("category", category);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching habits by category:", error);
      throw error;
    }
  }
}
