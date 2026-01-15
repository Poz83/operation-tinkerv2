export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_by: string
          expires_at: string | null
          id: string
          is_dismissible: boolean
          published_at: string
          target_audience: string
          title: string
          type: string
        }
        Insert: {
          content: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_dismissible?: boolean
          published_at?: string
          target_audience?: string
          title: string
          type: string
        }
        Update: {
          content?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_dismissible?: boolean
          published_at?: string
          target_audience?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_content: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          id: string
          pattern: string
          type: string
        }
        Insert: {
          action?: string
          created_at?: string
          created_by?: string | null
          id?: string
          pattern: string
          type: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          id?: string
          pattern?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_content_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_emails: {
        Row: {
          added_at: string
          domain: string
          source: string | null
        }
        Insert: {
          added_at?: string
          domain: string
          source?: string | null
        }
        Update: {
          added_at?: string
          domain?: string
          source?: string | null
        }
        Relationships: []
      }
      coloring_studio_data: {
        Row: {
          audience: string | null
          complexity: string | null
          line_weight: string | null
          page_count: number | null
          project_id: string
          style: string | null
        }
        Insert: {
          audience?: string | null
          complexity?: string | null
          line_weight?: string | null
          page_count?: number | null
          project_id: string
          style?: string | null
        }
        Update: {
          audience?: string | null
          complexity?: string | null
          line_weight?: string | null
          page_count?: number | null
          project_id?: string
          style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coloring_studio_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cookie_consent: {
        Row: {
          analytics: boolean
          consent_version: string
          consented_at: string
          essential: boolean
          functional: boolean
          id: string
          ip_hash: string | null
          marketing: boolean
          user_id: string | null
        }
        Insert: {
          analytics?: boolean
          consent_version: string
          consented_at?: string
          essential?: boolean
          functional?: boolean
          id?: string
          ip_hash?: string | null
          marketing?: boolean
          user_id?: string | null
        }
        Update: {
          analytics?: boolean
          consent_version?: string
          consented_at?: string
          essential?: boolean
          functional?: boolean
          id?: string
          ip_hash?: string | null
          marketing?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cookie_consent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_creator_data: {
        Row: {
          author_name: string | null
          book_title: string | null
          dimensions: string | null
          genre: string | null
          project_id: string
          spine_text: string | null
        }
        Insert: {
          author_name?: string | null
          book_title?: string | null
          dimensions?: string | null
          genre?: string | null
          project_id: string
          spine_text?: string | null
        }
        Update: {
          author_name?: string | null
          book_title?: string | null
          dimensions?: string | null
          genre?: string | null
          project_id?: string
          spine_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cover_creator_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      data_requests: {
        Row: {
          completed_at: string | null
          download_url: string | null
          expires_at: string | null
          id: string
          request_type: string
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          id?: string
          request_type: string
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          id?: string
          request_type?: string
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissed_announcements: {
        Row: {
          announcement_id: string
          dismissed_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          dismissed_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          dismissed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_announcements_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissed_announcements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          id: string
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          message: string
          page_url: string | null
          screenshot_url: string | null
          status: string
          type: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message: string
          page_url?: string | null
          screenshot_url?: string | null
          status?: string
          type: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message?: string
          page_url?: string | null
          screenshot_url?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          model_version: string
          project_id: string
          prompt: string
          result_image_id: string | null
          settings: Json
          status: string
          tool_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          model_version: string
          project_id: string
          prompt: string
          result_image_id?: string | null
          settings?: Json
          status?: string
          tool_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          model_version?: string
          project_id?: string
          prompt?: string
          result_image_id?: string | null
          settings?: Json
          status?: string
          tool_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_result_image_id_fkey"
            columns: ["result_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_lab_data: {
        Row: {
          art_style: string | null
          background: string | null
          character_name: string | null
          pose: string | null
          project_id: string
        }
        Insert: {
          art_style?: string | null
          background?: string | null
          character_name?: string | null
          pose?: string | null
          project_id: string
        }
        Update: {
          art_style?: string | null
          background?: string | null
          character_name?: string | null
          pose?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hero_lab_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          created_at: string
          file_size_bytes: number | null
          filename: string | null
          generation_prompt: string | null
          height: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          parent_image_id: string | null
          project_id: string
          storage_path: string
          type: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          file_size_bytes?: number | null
          filename?: string | null
          generation_prompt?: string | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          parent_image_id?: string | null
          project_id: string
          storage_path: string
          type: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          file_size_bytes?: number | null
          filename?: string | null
          generation_prompt?: string | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          parent_image_id?: string | null
          project_id?: string
          storage_path?: string
          type?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "images_parent_image_id_fkey"
            columns: ["parent_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kdp_exports: {
        Row: {
          author_name: string
          book_title: string
          completed_at: string | null
          cover_pdf_url: string | null
          created_at: string
          dimensions: string
          id: string
          interior_pdf_url: string | null
          interior_type: string
          isbn: string | null
          project_id: string
          status: string
          user_id: string
        }
        Insert: {
          author_name: string
          book_title: string
          completed_at?: string | null
          cover_pdf_url?: string | null
          created_at?: string
          dimensions: string
          id?: string
          interior_pdf_url?: string | null
          interior_type: string
          isbn?: string | null
          project_id: string
          status?: string
          user_id: string
        }
        Update: {
          author_name?: string
          book_title?: string
          completed_at?: string | null
          cover_pdf_url?: string | null
          created_at?: string
          dimensions?: string
          id?: string
          interior_pdf_url?: string | null
          interior_type?: string
          isbn?: string | null
          project_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kdp_exports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kdp_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content: string
          id: string
          published_at: string
          requires_reconsent: boolean
          type: string
          version: string
        }
        Insert: {
          content: string
          id?: string
          published_at?: string
          requires_reconsent?: boolean
          type: string
          version: string
        }
        Update: {
          content?: string
          id?: string
          published_at?: string
          requires_reconsent?: boolean
          type?: string
          version?: string
        }
        Relationships: []
      }
      monochrome_maker_data: {
        Row: {
          contrast_level: string | null
          project_id: string
          source_image_id: string | null
          style: string | null
        }
        Insert: {
          contrast_level?: string | null
          project_id: string
          source_image_id?: string | null
          style?: string | null
        }
        Update: {
          contrast_level?: string | null
          project_id?: string
          source_image_id?: string | null
          style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monochrome_maker_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monochrome_maker_data_source_image_id_fkey"
            columns: ["source_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      paint_by_numbers_data: {
        Row: {
          color_palette: Json | null
          difficulty: string | null
          num_colors: number | null
          project_id: string
          source_image_id: string | null
        }
        Insert: {
          color_palette?: Json | null
          difficulty?: string | null
          num_colors?: number | null
          project_id: string
          source_image_id?: string | null
        }
        Update: {
          color_palette?: Json | null
          difficulty?: string | null
          num_colors?: number | null
          project_id?: string
          source_image_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paint_by_numbers_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paint_by_numbers_data_source_image_id_fkey"
            columns: ["source_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          public_id: string
          share_permission: string | null
          share_token: string | null
          share_token_created_at: string | null
          title: string
          tool_type: string
          updated_at: string
          user_id: string | null
          visibility: string
          workspace_id: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          public_id: string
          share_permission?: string | null
          share_token?: string | null
          share_token_created_at?: string | null
          title?: string
          tool_type: string
          updated_at?: string
          user_id?: string | null
          visibility?: string
          workspace_id?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          public_id?: string
          share_permission?: string | null
          share_token?: string | null
          share_token_created_at?: string | null
          title?: string
          tool_type?: string
          updated_at?: string
          user_id?: string | null
          visibility?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          count: number
          user_id: string
          window_hours: number
          window_start: string
        }
        Insert: {
          action_type: string
          count?: number
          user_id: string
          window_hours?: number
          window_start?: string
        }
        Update: {
          action_type?: string
          count?: number
          user_id?: string
          window_hours?: number
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          conversions_count: number
          created_at: string
          referrals_count: number
          rewards_earned: number
          terms_accepted_at: string
          terms_version: string
          user_id: string
        }
        Insert: {
          code: string
          conversions_count?: number
          created_at?: string
          referrals_count?: number
          rewards_earned?: number
          terms_accepted_at: string
          terms_version: string
          user_id: string
        }
        Update: {
          code?: string
          conversions_count?: number
          created_at?: string
          referrals_count?: number
          rewards_earned?: number
          terms_accepted_at?: string
          terms_version?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          converted: boolean
          converted_at: string | null
          id: string
          referred_at: string
          referred_id: string
          referrer_id: string
          reward_granted: boolean
        }
        Insert: {
          converted?: boolean
          converted_at?: string | null
          id?: string
          referred_at?: string
          referred_id: string
          referrer_id: string
          reward_granted?: boolean
        }
        Update: {
          converted?: boolean
          converted_at?: string | null
          id?: string
          referred_at?: string
          referred_id?: string
          referrer_id?: string
          reward_granted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          reviewed: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          reviewed?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          reviewed?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      storybook_creator_data: {
        Row: {
          characters: Json | null
          page_count: number | null
          project_id: string
          reading_level: string | null
          story_theme: string | null
        }
        Insert: {
          characters?: Json | null
          page_count?: number | null
          project_id: string
          reading_level?: string | null
          story_theme?: string | null
        }
        Update: {
          characters?: Json | null
          page_count?: number | null
          project_id?: string
          reading_level?: string | null
          story_theme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storybook_creator_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          api_calls_count: number
          exports_count: number
          generations_count: number
          period_start: string
          storage_bytes: number
          uploads_count: number
          user_id: string
        }
        Insert: {
          api_calls_count?: number
          exports_count?: number
          generations_count?: number
          period_start: string
          storage_bytes?: number
          uploads_count?: number
          user_id: string
        }
        Update: {
          api_calls_count?: number
          exports_count?: number
          generations_count?: number
          period_start?: string
          storage_bytes?: number
          uploads_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consent_records: {
        Row: {
          accepted_at: string
          document_type: string
          document_version: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          document_type: string
          document_version: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          document_type?: string
          document_version?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consent_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          is_current: boolean
          last_active_at: string
          location: string | null
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          location?: string | null
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          location?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          default_tool: string | null
          email_generation_complete: boolean
          email_login_alerts: boolean
          email_marketing: boolean
          email_product_updates: boolean
          enable_celebrations: boolean
          enable_keyboard_shortcuts: boolean
          enable_prompt_quality: boolean
          enable_recent_prompts: boolean
          enable_smart_defaults: boolean
          enable_style_previews: boolean
          enable_summary_card: boolean
          reduced_motion: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          default_tool?: string | null
          email_generation_complete?: boolean
          email_login_alerts?: boolean
          email_marketing?: boolean
          email_product_updates?: boolean
          enable_celebrations?: boolean
          enable_keyboard_shortcuts?: boolean
          enable_prompt_quality?: boolean
          enable_recent_prompts?: boolean
          enable_smart_defaults?: boolean
          enable_style_previews?: boolean
          enable_summary_card?: boolean
          reduced_motion?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          default_tool?: string | null
          email_generation_complete?: boolean
          email_login_alerts?: boolean
          email_marketing?: boolean
          email_product_updates?: boolean
          enable_celebrations?: boolean
          enable_keyboard_shortcuts?: boolean
          enable_prompt_quality?: boolean
          enable_recent_prompts?: boolean
          enable_smart_defaults?: boolean
          enable_style_previews?: boolean
          enable_summary_card?: boolean
          reduced_motion?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          billing_email: string | null
          created_at: string
          deleted_at: string | null
          deletion_scheduled_for: string | null
          display_name: string | null
          email: string
          id: string
          is_admin: boolean
          is_whitelisted: boolean
          locale: string | null
          plan: string
          plan_expires_at: string | null
          plan_started_at: string | null
          stripe_customer_id: string | null
          timezone: string | null
          updated_at: string
          whitelist_granted_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_email?: string | null
          created_at?: string
          deleted_at?: string | null
          deletion_scheduled_for?: string | null
          display_name?: string | null
          email: string
          id: string
          is_admin?: boolean
          is_whitelisted?: boolean
          locale?: string | null
          plan?: string
          plan_expires_at?: string | null
          plan_started_at?: string | null
          stripe_customer_id?: string | null
          timezone?: string | null
          updated_at?: string
          whitelist_granted_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_email?: string | null
          created_at?: string
          deleted_at?: string | null
          deletion_scheduled_for?: string | null
          display_name?: string | null
          email?: string
          id?: string
          is_admin?: boolean
          is_whitelisted?: boolean
          locale?: string | null
          plan?: string
          plan_expires_at?: string | null
          plan_started_at?: string | null
          stripe_customer_id?: string | null
          timezone?: string | null
          updated_at?: string
          whitelist_granted_at?: string | null
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          accepted_at: string | null
          invited_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          invited_at?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          invited_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          plan: string
          slug: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          plan?: string
          slug: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          plan?: string
          slug?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_project_public_id: { Args: { tool: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
