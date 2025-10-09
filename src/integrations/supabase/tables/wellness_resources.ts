export type WellnessResources = {
  Row: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    duration: number | null;
    audio_url: string | null;
    audio_type: "file" | "youtube"; // Explicitly define enum values
    youtube_url: string | null;
    youtube_audio_extracted: boolean;
    is_public: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    title: string;
    description?: string | null;
    category: string;
    duration?: number | null;
    audio_url?: string | null;
    audio_type?: "file" | "youtube";
    youtube_url?: string | null;
    youtube_audio_extracted?: boolean;
    is_public?: boolean;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    title?: string;
    description?: string | null;
    category?: string;
    duration?: number | null;
    audio_url?: string | null;
    audio_type?: "file" | "youtube";
    youtube_url?: string | null;
    youtube_audio_extracted?: boolean;
    is_public?: boolean;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};