export type CommunityConnections = {
  Row: {
    id: string;
    requester_id: string | null;
    receiver_id: string | null;
    status: string | null;
    created_at: string | null;
    message: string | null;
    updated_at: string;
  };
  Insert: {
    id?: string;
    requester_id?: string | null;
    receiver_id?: string | null;
    status?: string | null;
    created_at?: string | null;
    message?: string | null;
    updated_at?: string;
  };
  Update: {
    id?: string;
    requester_id?: string | null;
    receiver_id?: string | null;
    status?: string | null;
    created_at?: string | null;
    message?: string | null;
    updated_at?: string;
  };
  Relationships: [];
};