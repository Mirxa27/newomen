import type { Json } from "../types";

export type Messages = {
  Row: {
    id: string;
    session_id: string | null;
    sender: string;
    text_content: string | null;
    audio_url: string | null;
    emotion_data: Json | null;
    ts: string | null;
    conversation_id: string | null;
  };
  Insert: { [key: string]: unknown };
  Update: { [key: string]: unknown };
  Relationships: [];
};