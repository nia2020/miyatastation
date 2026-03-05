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
          full_name: string;
          role: "member" | "admin" | "poster";
          member_number: string;
          nickname: string | null;
          birthday: string | null;
          birthday_wish_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: "member" | "admin" | "poster";
          member_number: string;
          nickname?: string | null;
          birthday?: string | null;
          birthday_wish_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: "member" | "admin" | "poster";
          member_number?: string;
          nickname?: string | null;
          birthday?: string | null;
          birthday_wish_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          zoom_url: string;
          zoom_meeting_id: string | null;
          zoom_passcode: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          zoom_url: string;
          zoom_meeting_id?: string | null;
          zoom_passcode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          zoom_url?: string;
          zoom_meeting_id?: string | null;
          zoom_passcode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      form_themes: {
        Row: {
          id: string;
          theme: string;
          questions: string[];
          week_start: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          theme: string;
          questions: string[];
          week_start: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          theme?: string;
          questions?: string[];
          week_start?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      form_submissions: {
        Row: {
          id: string;
          user_id: string;
          form_theme_id: string;
          answers: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          form_theme_id: string;
          answers: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          form_theme_id?: string;
          answers?: string[];
          created_at?: string;
        };
      };
      admin_posts: {
        Row: {
          id: string;
          title: string;
          content: string;
          author_id: string;
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          author_id: string;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          author_id?: string;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type FormTheme = Database["public"]["Tables"]["form_themes"]["Row"];
export type FormSubmission =
  Database["public"]["Tables"]["form_submissions"]["Row"];
export type AdminPost = Database["public"]["Tables"]["admin_posts"]["Row"];
export type PostComment = Database["public"]["Tables"]["post_comments"]["Row"];
