import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () => createClientComponentClient();

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          google_id: string | null;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          is_online: boolean;
          last_seen: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          google_id?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          is_online?: boolean;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          google_id?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          is_online?: boolean;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          participant1_id: string;
          participant2_id: string;
          last_message_id: string | null;
          last_message_timestamp: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participant1_id: string;
          participant2_id: string;
          last_message_id?: string | null;
          last_message_timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          participant1_id?: string;
          participant2_id?: string;
          last_message_id?: string | null;
          last_message_timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          message_type: string;
          file_url: string | null;
          file_name: string | null;
          file_size: number | null;
          reply_to_id: string | null;
          edited: boolean;
          deleted: boolean;
          read_by: any;
          timestamp: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content?: string | null;
          message_type?: string;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          reply_to_id?: string | null;
          edited?: boolean;
          deleted?: boolean;
          read_by?: any;
          timestamp?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string | null;
          message_type?: string;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          reply_to_id?: string | null;
          edited?: boolean;
          deleted?: boolean;
          read_by?: any;
          timestamp?: string;
          updated_at?: string;
        };
      };
      typing_indicators: {
        Row: {
          conversation_id: string;
          user_id: string;
          is_typing: boolean;
          updated_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          is_typing?: boolean;
          updated_at?: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          is_typing?: boolean;
          updated_at?: string;
        };
      };
    };
    Functions: {
      check_username_availability: {
        Args: { desired_username: string };
        Returns: boolean;
      };
    };
  };
};