export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: "admin" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: "admin" | "member";
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: "admin" | "member";
          joined_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          title: string;
          description: string | null;
          section: "yesterday" | "today" | "blockers";
          status: "pending" | "in_progress" | "done";
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          section: "yesterday" | "today" | "blockers";
          status?: "pending" | "in_progress" | "done";
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          section?: "yesterday" | "today" | "blockers";
          status?: "pending" | "in_progress" | "done";
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      presence: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          last_seen: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          last_seen?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          last_seen?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
