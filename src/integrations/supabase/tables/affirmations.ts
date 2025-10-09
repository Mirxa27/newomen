export type Affirmations = {
  Row: {
    id: string;
    content: string;
    category: string;
    tone: string | null;
    tags: string[] | null;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    content: string;
    category?: string;
    tone?: string | null;
    tags?: string[] | null;
    is_active?: boolean;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    content?: string;
    category?: string;
    tone?: string | null;
    tags?: string[] | null;
    is_active?: boolean;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};