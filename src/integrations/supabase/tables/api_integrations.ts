export type ApiIntegrations = {
  Row: {
    id: string;
    service: string;
    client_id: string | null;
    client_secret: string | null;
    mode: string | null;
    is_active: boolean;
    last_tested: string | null;
    test_status: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    service: string;
    client_id?: string | null;
    client_secret?: string | null;
    mode?: string | null;
    is_active?: boolean;
    last_tested?: string | null;
    test_status?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    service?: string;
    client_id?: string | null;
    client_secret?: string | null;
    mode?: string | null;
    is_active?: boolean;
    last_tested?: string | null;
    test_status?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};