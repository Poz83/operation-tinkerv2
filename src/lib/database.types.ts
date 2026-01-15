/**
 * Generated TypeScript types for Supabase database
 * 
 * Note: In production, generate these automatically using:
 * npx supabase gen types typescript --project-id jjlbdzwuhvupggfhhxiz > src/lib/database.types.ts
 * 
 * For now, this is a manual type definition matching the schema.
 */

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
            users: {
                Row: {
                    id: string;
                    email: string;
                    display_name: string | null;
                    avatar_url: string | null;
                    timezone: string;
                    locale: string;
                    is_whitelisted: boolean;
                    whitelist_granted_at: string | null;
                    is_admin: boolean;
                    plan: 'free' | 'starter' | 'pro' | 'team';
                    plan_started_at: string | null;
                    plan_expires_at: string | null;
                    stripe_customer_id: string | null;
                    billing_email: string | null;
                    deleted_at: string | null;
                    deletion_scheduled_for: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    timezone?: string;
                    locale?: string;
                    is_whitelisted?: boolean;
                    whitelist_granted_at?: string | null;
                    is_admin?: boolean;
                    plan?: 'free' | 'starter' | 'pro' | 'team';
                    plan_started_at?: string | null;
                    plan_expires_at?: string | null;
                    stripe_customer_id?: string | null;
                    billing_email?: string | null;
                    deleted_at?: string | null;
                    deletion_scheduled_for?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    timezone?: string;
                    locale?: string;
                    is_whitelisted?: boolean;
                    whitelist_granted_at?: string | null;
                    is_admin?: boolean;
                    plan?: 'free' | 'starter' | 'pro' | 'team';
                    plan_started_at?: string | null;
                    plan_expires_at?: string | null;
                    stripe_customer_id?: string | null;
                    billing_email?: string | null;
                    deleted_at?: string | null;
                    deletion_scheduled_for?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            projects: {
                Row: {
                    id: string;
                    public_id: string;
                    tool_type: 'coloring_studio' | 'hero_lab' | 'cover_creator' | 'monochrome_maker' | 'storybook_creator' | 'paint_by_numbers';
                    user_id: string | null;
                    workspace_id: string | null;
                    title: string;
                    description: string | null;
                    cover_image_url: string | null;
                    visibility: 'private' | 'unlisted' | 'public';
                    share_token: string | null;
                    share_token_created_at: string | null;
                    share_permission: 'view' | 'edit' | 'comment' | null;
                    is_archived: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    public_id: string;
                    tool_type: 'coloring_studio' | 'hero_lab' | 'cover_creator' | 'monochrome_maker' | 'storybook_creator' | 'paint_by_numbers';
                    user_id?: string | null;
                    workspace_id?: string | null;
                    title?: string;
                    description?: string | null;
                    cover_image_url?: string | null;
                    visibility?: 'private' | 'unlisted' | 'public';
                    share_token?: string | null;
                    share_token_created_at?: string | null;
                    share_permission?: 'view' | 'edit' | 'comment' | null;
                    is_archived?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    public_id?: string;
                    tool_type?: 'coloring_studio' | 'hero_lab' | 'cover_creator' | 'monochrome_maker' | 'storybook_creator' | 'paint_by_numbers';
                    user_id?: string | null;
                    workspace_id?: string | null;
                    title?: string;
                    description?: string | null;
                    cover_image_url?: string | null;
                    visibility?: 'private' | 'unlisted' | 'public';
                    share_token?: string | null;
                    share_token_created_at?: string | null;
                    share_permission?: 'view' | 'edit' | 'comment' | null;
                    is_archived?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            images: {
                Row: {
                    id: string;
                    project_id: string;
                    user_id: string;
                    type: 'upload' | 'generated' | 'edited';
                    storage_path: string;
                    filename: string | null;
                    mime_type: string | null;
                    width: number | null;
                    height: number | null;
                    file_size_bytes: number | null;
                    generation_prompt: string | null;
                    parent_image_id: string | null;
                    metadata: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    user_id: string;
                    type: 'upload' | 'generated' | 'edited';
                    storage_path: string;
                    filename?: string | null;
                    mime_type?: string | null;
                    width?: number | null;
                    height?: number | null;
                    file_size_bytes?: number | null;
                    generation_prompt?: string | null;
                    parent_image_id?: string | null;
                    metadata?: Json;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    user_id?: string;
                    type?: 'upload' | 'generated' | 'edited';
                    storage_path?: string;
                    filename?: string | null;
                    mime_type?: string | null;
                    width?: number | null;
                    height?: number | null;
                    file_size_bytes?: number | null;
                    generation_prompt?: string | null;
                    parent_image_id?: string | null;
                    metadata?: Json;
                    created_at?: string;
                };
            };
            generations: {
                Row: {
                    id: string;
                    project_id: string;
                    user_id: string;
                    tool_type: string;
                    prompt: string;
                    model_version: string;
                    settings: Json;
                    status: 'pending' | 'processing' | 'success' | 'failed';
                    error_message: string | null;
                    result_image_id: string | null;
                    duration_ms: number | null;
                    created_at: string;
                    completed_at: string | null;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    user_id: string;
                    tool_type: string;
                    prompt: string;
                    model_version: string;
                    settings?: Json;
                    status?: 'pending' | 'processing' | 'success' | 'failed';
                    error_message?: string | null;
                    result_image_id?: string | null;
                    duration_ms?: number | null;
                    created_at?: string;
                    completed_at?: string | null;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    user_id?: string;
                    tool_type?: string;
                    prompt?: string;
                    model_version?: string;
                    settings?: Json;
                    status?: 'pending' | 'processing' | 'success' | 'failed';
                    error_message?: string | null;
                    result_image_id?: string | null;
                    duration_ms?: number | null;
                    created_at?: string;
                    completed_at?: string | null;
                };
            };
            user_settings: {
                Row: {
                    user_id: string;
                    enable_style_previews: boolean;
                    enable_smart_defaults: boolean;
                    enable_keyboard_shortcuts: boolean;
                    enable_prompt_quality: boolean;
                    enable_summary_card: boolean;
                    enable_celebrations: boolean;
                    enable_recent_prompts: boolean;
                    theme: 'dark' | 'light' | 'system';
                    reduced_motion: boolean;
                    default_tool: string | null;
                    email_marketing: boolean;
                    email_product_updates: boolean;
                    email_generation_complete: boolean;
                    email_login_alerts: boolean;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    enable_style_previews?: boolean;
                    enable_smart_defaults?: boolean;
                    enable_keyboard_shortcuts?: boolean;
                    enable_prompt_quality?: boolean;
                    enable_summary_card?: boolean;
                    enable_celebrations?: boolean;
                    enable_recent_prompts?: boolean;
                    theme?: 'dark' | 'light' | 'system';
                    reduced_motion?: boolean;
                    default_tool?: string | null;
                    email_marketing?: boolean;
                    email_product_updates?: boolean;
                    email_generation_complete?: boolean;
                    email_login_alerts?: boolean;
                    updated_at?: string;
                };
                Update: {
                    user_id?: string;
                    enable_style_previews?: boolean;
                    enable_smart_defaults?: boolean;
                    enable_keyboard_shortcuts?: boolean;
                    enable_prompt_quality?: boolean;
                    enable_summary_card?: boolean;
                    enable_celebrations?: boolean;
                    enable_recent_prompts?: boolean;
                    theme?: 'dark' | 'light' | 'system';
                    reduced_motion?: boolean;
                    default_tool?: string | null;
                    email_marketing?: boolean;
                    email_product_updates?: boolean;
                    email_generation_complete?: boolean;
                    email_login_alerts?: boolean;
                    updated_at?: string;
                };
            };
            feature_flags: {
                Row: {
                    id: string;
                    key: string;
                    enabled: boolean;
                    description: string | null;
                    updated_at: string;
                    updated_by: string | null;
                };
                Insert: {
                    id?: string;
                    key: string;
                    enabled?: boolean;
                    description?: string | null;
                    updated_at?: string;
                    updated_by?: string | null;
                };
                Update: {
                    id?: string;
                    key?: string;
                    enabled?: boolean;
                    description?: string | null;
                    updated_at?: string;
                    updated_by?: string | null;
                };
            };
            feedback: {
                Row: {
                    id: string;
                    user_id: string;
                    type: 'bug' | 'problem' | 'suggestion' | 'question' | 'praise';
                    message: string;
                    page_url: string | null;
                    screenshot_url: string | null;
                    user_agent: string | null;
                    status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'wont_fix';
                    admin_notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: 'bug' | 'problem' | 'suggestion' | 'question' | 'praise';
                    message: string;
                    page_url?: string | null;
                    screenshot_url?: string | null;
                    user_agent?: string | null;
                    status?: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'wont_fix';
                    admin_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    type?: 'bug' | 'problem' | 'suggestion' | 'question' | 'praise';
                    message?: string;
                    page_url?: string | null;
                    screenshot_url?: string | null;
                    user_agent?: string | null;
                    status?: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'wont_fix';
                    admin_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            announcements: {
                Row: {
                    id: string;
                    title: string;
                    content: string;
                    type: 'feature' | 'update' | 'maintenance' | 'tip';
                    target_audience: 'all' | 'free' | 'pro' | 'new_users';
                    is_dismissible: boolean;
                    published_at: string;
                    expires_at: string | null;
                    created_by: string;
                };
                Insert: {
                    id?: string;
                    title: string;
                    content: string;
                    type: 'feature' | 'update' | 'maintenance' | 'tip';
                    target_audience?: 'all' | 'free' | 'pro' | 'new_users';
                    is_dismissible?: boolean;
                    published_at?: string;
                    expires_at?: string | null;
                    created_by: string;
                };
                Update: {
                    id?: string;
                    title?: string;
                    content?: string;
                    type?: 'feature' | 'update' | 'maintenance' | 'tip';
                    target_audience?: 'all' | 'free' | 'pro' | 'new_users';
                    is_dismissible?: boolean;
                    published_at?: string;
                    expires_at?: string | null;
                    created_by?: string;
                };
            };
            usage_tracking: {
                Row: {
                    user_id: string;
                    period_start: string;
                    generations_count: number;
                    uploads_count: number;
                    exports_count: number;
                    storage_bytes: number;
                    api_calls_count: number;
                };
                Insert: {
                    user_id: string;
                    period_start: string;
                    generations_count?: number;
                    uploads_count?: number;
                    exports_count?: number;
                    storage_bytes?: number;
                    api_calls_count?: number;
                };
                Update: {
                    user_id?: string;
                    period_start?: string;
                    generations_count?: number;
                    uploads_count?: number;
                    exports_count?: number;
                    storage_bytes?: number;
                    api_calls_count?: number;
                };
            };
        };
        Views: Record<string, never>;
        Functions: {
            generate_project_public_id: {
                Args: { tool: string };
                Returns: string;
            };
        };
        Enums: Record<string, never>;
    };
}

// Convenience types for common operations
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type Image = Database['public']['Tables']['images']['Row'];
export type ImageInsert = Database['public']['Tables']['images']['Insert'];

export type Generation = Database['public']['Tables']['generations']['Row'];
export type GenerationInsert = Database['public']['Tables']['generations']['Insert'];

export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

export type FeatureFlag = Database['public']['Tables']['feature_flags']['Row'];

export type Feedback = Database['public']['Tables']['feedback']['Row'];
export type FeedbackInsert = Database['public']['Tables']['feedback']['Insert'];

export type Announcement = Database['public']['Tables']['announcements']['Row'];

export type UsageTracking = Database['public']['Tables']['usage_tracking']['Row'];
