import { supabase } from "@/integrations/supabase/client";

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  category: 'melody' | 'nature' | 'brainwave';
  url: string;
  duration_seconds: number;
  cover_image_url?: string;
}

export class AudioService {
  static async getAudioTracks(category?: AudioTrack['category']): Promise<AudioTrack[]> {
    try {
      let query = supabase.from('audio_library').select('*');
      if (category) {
        query = query.eq('category', category);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as AudioTrack[];
    } catch (error) {
      console.error('Error fetching audio tracks:', error);
      return [];
    }
  }
}





