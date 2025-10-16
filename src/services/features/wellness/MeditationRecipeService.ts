import { supabase } from "@/integrations/supabase/client";

export interface MeditationRecipe {
  id: string;
  title: string;
  description: string;
  meditation_ids: string[];
  // Assuming meditations are related and can be fetched
  meditations: { title: string; duration_minutes: number }[];
}

export class MeditationRecipeService {
  static async getRecipes(): Promise<MeditationRecipe[]> {
    try {
      const { data, error } = await supabase
        .from('meditation_recipes')
        .select(`
          id,
          title,
          description,
          meditation_ids,
          meditations:meditation_meditation_recipes (
            title,
            duration_minutes
          )
        `);
      if (error) throw error;
      return data as unknown as MeditationRecipe[];
    } catch (error) {
      console.error('Error fetching meditation recipes:', error);
      return [];
    }
  }
}





