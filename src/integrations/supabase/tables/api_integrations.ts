export type ApiIntegrations = {
  Row: {
    id: string;
    service: string;
    client_id: string | null;
    client_secret: string | null;
    mode: string | null;
    is_active: boolean | null;
    last_tested: string | null;
    test_status: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: string;
    service: string;
    client_id?: string | null;
    client_secret?: string | null;
    mode?: string | null;
    is_active?: boolean | null;
    last_tested?: string | null;
    test_status?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    service?: string;
    client_id?: string | null;
    client_secret?: string | null;
    mode?: string | null;
    is_active?: boolean | null;
    last_tested?: string | null;
    test_status?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
};