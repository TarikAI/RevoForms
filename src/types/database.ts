export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      forms: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          fields: Json
          settings: Json
          style: Json
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          fields?: Json
          settings?: Json
          style?: Json
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          fields?: Json
          settings?: Json
          style?: Json
          status?: 'draft' | 'published' | 'archived'
          updated_at?: string
          published_at?: string | null
        }
      }
      form_submissions: {
        Row: {
          id: string
          form_id: string
          data: Json
          metadata: Json
          submitted_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          form_id: string
          data: Json
          metadata?: Json
          submitted_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          data?: Json
          metadata?: Json
        }
      }
      form_analytics: {
        Row: {
          id: string
          form_id: string
          views: number
          starts: number
          completions: number
          average_time: number
          drop_off_field: string | null
          date: string
        }
        Insert: {
          id?: string
          form_id: string
          views?: number
          starts?: number
          completions?: number
          average_time?: number
          drop_off_field?: string | null
          date?: string
        }
        Update: {
          views?: number
          starts?: number
          completions?: number
          average_time?: number
          drop_off_field?: string | null
        }
      }
      ab_tests: {
        Row: {
          id: string
          form_id: string
          name: string
          status: 'draft' | 'running' | 'paused' | 'completed'
          variants: Json
          traffic_split: number
          start_date: string | null
          end_date: string | null
          winner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_id: string
          name: string
          status?: 'draft' | 'running' | 'paused' | 'completed'
          variants?: Json
          traffic_split?: number
          start_date?: string | null
          end_date?: string | null
          winner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          status?: 'draft' | 'running' | 'paused' | 'completed'
          variants?: Json
          traffic_split?: number
          start_date?: string | null
          end_date?: string | null
          winner_id?: string | null
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          fields: Json
          settings: Json
          style: Json
          thumbnail_url: string | null
          is_public: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          fields?: Json
          settings?: Json
          style?: Json
          thumbnail_url?: string | null
          is_public?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          category?: string
          fields?: Json
          settings?: Json
          style?: Json
          thumbnail_url?: string | null
          is_public?: boolean
        }
      }
      integrations: {
        Row: {
          id: string
          user_id: string
          form_id: string
          type: string
          config: Json
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          form_id: string
          type: string
          config?: Json
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          enabled?: boolean
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          profile_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          profile_data?: Json
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      form_status: 'draft' | 'published' | 'archived'
      test_status: 'draft' | 'running' | 'paused' | 'completed'
    }
  }
}
