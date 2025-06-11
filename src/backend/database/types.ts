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

      events: {
        Row: {
          color: string | null
          description: string | null
          end_time: string
          google_event_id: string | null
          id: string
          project: string | null
          source: string | null
          start_time: string
          title: string
          user: string | null
          reminder_at: string | null
          reminder_sent: boolean
          is_recurring: boolean | null
          recurrence_pattern: string | null
          recurrence_days: Json | null
          recurrence_end_date: string | null
          recurrence_count: number | null
          parent_id: string | null
        }
        Insert: {
          color?: string | null
          description?: string | null
          end_time: string
          google_event_id?: string | null
          id: string
          project?: string | null
          source?: string | null
          start_time: string
          title: string
          user?: string | null
          reminder_at?: string | null
          reminder_sent?: boolean
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          recurrence_days?: Json | null
          recurrence_end_date?: string | null
          recurrence_count?: number | null
          parent_id?: string | null
        }
        Update: {
          color?: string | null
          description?: string | null
          end_time?: string
          google_event_id?: string | null
          id?: string
          project?: string | null
          source?: string | null
          start_time?: string
          title?: string
          user?: string | null
          reminder_at?: string | null
          reminder_sent?: boolean
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          recurrence_days?: Json | null
          recurrence_end_date?: string | null
          recurrence_count?: number | null
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_project_fkey"
            columns: ["project"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          event: string | null
          file: string
          id: string
          name: string
          project: string | null
          task: string | null
          type: string
          user: string
        }
        Insert: {
          event?: string | null
          file: string
          id: string
          name: string
          project?: string | null
          task?: string | null
          type: string
          user: string
        }
        Update: {
          event?: string | null
          file?: string
          id?: string
          name?: string
          project?: string | null
          task?: string | null
          type?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_fkey"
            columns: ["project"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_task_fkey"
            columns: ["task"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string
          email: string
          expires_at: string
          id: string
          refresh_token: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          id: string
          last_updated: string | null
          project: string | null
          user: string | null
        }
        Insert: {
          content?: string | null
          id: string
          last_updated?: string | null
          project?: string | null
          user?: string | null
        }
        Update: {
          content?: string | null
          id?: string
          last_updated?: string | null
          project?: string | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_project_fkey"
            columns: ["project"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string | null
          description: string | null
          id: string
          name: string
          user: string | null
        }
        Insert: {
          color?: string | null
          description?: string | null
          id: string
          name: string
          user?: string | null
        }
        Update: {
          color?: string | null
          description?: string | null
          id?: string
          name?: string
          user?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: string | null;
          priority: string | null;
          due_date: string | null;
          user: string | null;
          project: string | null;
          archived: boolean | null;
          completion_date: string | null;
          labels: string[] | null;
          parent_task_id: string | null;
          last_updated_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          reminder_at: string | null
          reminder_sent: boolean
          is_recurring: boolean | null;
          recurrence_pattern: string | null;
          recurrence_days: Json | null;
          recurrence_end_date: string | null;
          recurrence_count: number | null;
          parent_id: string | null;
          recurrence_mode: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          due_date?: string | null;
          user?: string | null;
          project?: string | null;
          archived?: boolean | null;
          completion_date?: string | null;
          labels?: string[] | null;
          parent_task_id?: string | null;
          last_updated_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          reminder_at?: string | null
          reminder_sent?: boolean
          is_recurring?: boolean | null;
          recurrence_pattern?: string | null;
          recurrence_days?: Json | null;
          recurrence_end_date?: string | null;
          recurrence_count?: number | null;
          parent_id?: string | null;
          recurrence_mode?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          due_date?: string | null;
          user?: string | null;
          project?: string | null;
          archived?: boolean | null;
          completion_date?: string | null;
          labels?: string[] | null;
          parent_task_id?: string | null;
          last_updated_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          reminder_at?: string | null
          reminder_sent?: boolean
          is_recurring?: boolean | null;
          recurrence_pattern?: string | null;
          recurrence_days?: Json | null;
          recurrence_end_date?: string | null;
          recurrence_count?: number | null;
          parent_id?: string | null;
          recurrence_mode?: string | null;
        };
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
