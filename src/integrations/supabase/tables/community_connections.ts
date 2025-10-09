import { UserProfiles } from "./user_profiles"; // Import UserProfiles

export type CommunityConnections = {
  Row: {
    id: string;
    requester_id: string;
    receiver_id: string;
    status: "pending" | "accepted" | "declined"; // Explicitly define enum values
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    requester_id: string;
    receiver_id: string;
    status?: "pending" | "accepted" | "declined";
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    requester_id?: string;
    receiver_id?: string;
    status?: "pending" | "accepted" | "declined";
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "community_connections_receiver_id_fkey";
      columns: ["receiver_id"];
      isOneToOne: false;
      referencedRelation: "user_profiles";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "community_connections_requester_id_fkey";
      columns: ["requester_id"];
      isOneToOne: false;
      referencedRelation: "user_profiles";
      referencedColumns: ["id"];
    }
  ];
};

// Define a type for a connection with joined user profiles
export type CommunityConnectionWithProfiles = CommunityConnections['Row'] & {
  requester: UserProfiles['Row'];
  receiver: UserProfiles['Row'];
};