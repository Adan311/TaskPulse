export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_metadata: {
        Row: {
          id: string
          insights: Json | null
          task: string | null
          user: string | null
        }
        Insert: {
          id: string
          insights?: Json | null
          task?: string | null
          user?: string | null
        }
        Update: {
          id?: string
          insights?: Json | null
          task?: string | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_metadata_task_fkey"
            columns: ["task"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          color: string | null
          description: string | null
          end_time: string
          id: string
          project: string | null
          start_time: string
          title: string
          user: string | null
        }
        Insert: {
          color?: string | null
          description?: string | null
          end_time: string
          id: string
          project?: string | null
          start_time: string
          title: string
          user?: string | null
        }
        Update: {
          color?: string | null
          description?: string | null
          end_time?: string
          id?: string
          project?: string | null
          start_time?: string
          title?: string
          user?: string | null
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
          user: string | null
        }
        Insert: {
          event?: string | null
          file: string
          id: string
          name: string
          project?: string | null
          task?: string | null
          type: string
          user?: string | null
        }
        Update: {
          event?: string | null
          file?: string
          id?: string
          name?: string
          project?: string | null
          task?: string | null
          type?: string
          user?: string | null
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
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project: string | null
          status: string | null
          title: string
          user: string | null
        }
        Insert: {
          description?: string | null
          due_date?: string | null
          id: string
          priority?: string | null
          project?: string | null
          status?: string | null
          title: string
          user?: string | null
        }
        Update: {
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project?: string | null
          status?: string | null
          title?: string
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_fkey"
            columns: ["project"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
