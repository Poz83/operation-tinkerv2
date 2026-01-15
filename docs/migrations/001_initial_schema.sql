-- =============================================================================
-- MYJOE CREATIVE SUITE - INITIAL SCHEMA MIGRATION
-- =============================================================================
-- Version: 1.0
-- Generated: 2026-01-15
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Users (extends Supabase Auth)
-- -----------------------------------------------------------------------------
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    locale TEXT DEFAULT 'en-US',
    is_whitelisted BOOLEAN NOT NULL DEFAULT FALSE,
    whitelist_granted_at TIMESTAMPTZ,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'team')),
    plan_started_at TIMESTAMPTZ,
    plan_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    billing_email TEXT,
    deleted_at TIMESTAMPTZ,
    deletion_scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe_customer ON public.users(stripe_customer_id);

-- -----------------------------------------------------------------------------
-- Projects (shared across all tools)
-- -----------------------------------------------------------------------------
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT NOT NULL UNIQUE,
    tool_type TEXT NOT NULL CHECK (tool_type IN (
        'coloring_studio', 'hero_lab', 'cover_creator', 
        'monochrome_maker', 'storybook_creator', 'paint_by_numbers'
    )),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    workspace_id UUID, -- FK added later when workspaces table exists
    title TEXT NOT NULL DEFAULT 'Untitled',
    description TEXT,
    cover_image_url TEXT,
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public')),
    share_token TEXT,
    share_token_created_at TIMESTAMPTZ,
    share_permission TEXT CHECK (share_permission IN ('view', 'edit', 'comment')),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraint: owned by user XOR workspace
    CONSTRAINT projects_owner_check CHECK (
        (user_id IS NOT NULL AND workspace_id IS NULL) OR 
        (user_id IS NULL AND workspace_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_projects_public_id ON public.projects(public_id);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_workspace_id ON public.projects(workspace_id);

-- -----------------------------------------------------------------------------
-- Images
-- -----------------------------------------------------------------------------
CREATE TABLE public.images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('upload', 'generated', 'edited')),
    storage_path TEXT NOT NULL,
    filename TEXT,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    file_size_bytes BIGINT,
    generation_prompt TEXT,
    parent_image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_images_project_id ON public.images(project_id);
CREATE INDEX idx_images_user_id ON public.images(user_id);
CREATE INDEX idx_images_parent ON public.images(parent_image_id);

-- -----------------------------------------------------------------------------
-- Generations (AI generation history)
-- -----------------------------------------------------------------------------
CREATE TABLE public.generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tool_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    model_version TEXT NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
    error_message TEXT,
    result_image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_generations_user_id ON public.generations(user_id);
CREATE INDEX idx_generations_project_id ON public.generations(project_id);
CREATE INDEX idx_generations_created_at ON public.generations(created_at);

-- =============================================================================
-- TOOL-SPECIFIC DATA TABLES
-- =============================================================================

-- Coloring Studio
CREATE TABLE public.coloring_studio_data (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    style TEXT,
    audience TEXT,
    complexity TEXT,
    line_weight TEXT,
    page_count INTEGER DEFAULT 1
);

-- Hero Lab
CREATE TABLE public.hero_lab_data (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    character_name TEXT,
    pose TEXT,
    art_style TEXT,
    background TEXT
);

-- Cover Creator
CREATE TABLE public.cover_creator_data (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    book_title TEXT,
    author_name TEXT,
    genre TEXT,
    dimensions TEXT,
    spine_text TEXT
);

-- Monochrome Maker
CREATE TABLE public.monochrome_maker_data (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    source_image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
    contrast_level TEXT,
    style TEXT
);

-- Storybook Creator
CREATE TABLE public.storybook_creator_data (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    story_theme TEXT,
    reading_level TEXT,
    page_count INTEGER,
    characters JSONB DEFAULT '[]'
);

-- Paint by Numbers
CREATE TABLE public.paint_by_numbers_data (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    source_image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
    num_colors INTEGER DEFAULT 12,
    difficulty TEXT,
    color_palette JSONB
);

-- =============================================================================
-- SETTINGS & PREFERENCES
-- =============================================================================

CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    -- Studio Preferences
    enable_style_previews BOOLEAN NOT NULL DEFAULT FALSE,
    enable_smart_defaults BOOLEAN NOT NULL DEFAULT FALSE,
    enable_keyboard_shortcuts BOOLEAN NOT NULL DEFAULT FALSE,
    enable_prompt_quality BOOLEAN NOT NULL DEFAULT FALSE,
    enable_summary_card BOOLEAN NOT NULL DEFAULT FALSE,
    enable_celebrations BOOLEAN NOT NULL DEFAULT FALSE,
    enable_recent_prompts BOOLEAN NOT NULL DEFAULT FALSE,
    -- UI Preferences
    theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
    reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
    default_tool TEXT,
    -- Notifications
    email_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    email_product_updates BOOLEAN NOT NULL DEFAULT TRUE,
    email_generation_complete BOOLEAN NOT NULL DEFAULT TRUE,
    email_login_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- WORKSPACES & TEAMS (Future)
-- =============================================================================

CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_workspaces_slug ON public.workspaces(slug);

-- Add FK to projects now that workspaces exists
ALTER TABLE public.projects 
    ADD CONSTRAINT fk_projects_workspace 
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

CREATE TABLE public.workspace_members (
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    PRIMARY KEY (workspace_id, user_id)
);

-- =============================================================================
-- BILLING & USAGE
-- =============================================================================

CREATE TABLE public.usage_tracking (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    generations_count INTEGER NOT NULL DEFAULT 0,
    uploads_count INTEGER NOT NULL DEFAULT 0,
    exports_count INTEGER NOT NULL DEFAULT 0,
    storage_bytes BIGINT NOT NULL DEFAULT 0,
    api_calls_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, period_start)
);

-- =============================================================================
-- ADMIN & FEATURE FLAGS
-- =============================================================================

CREATE TABLE public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- GDPR & PRIVACY
-- =============================================================================

CREATE TABLE public.cookie_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ip_hash TEXT,
    consent_version TEXT NOT NULL,
    essential BOOLEAN NOT NULL DEFAULT TRUE,
    functional BOOLEAN NOT NULL DEFAULT FALSE,
    analytics BOOLEAN NOT NULL DEFAULT FALSE,
    marketing BOOLEAN NOT NULL DEFAULT FALSE,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('privacy_policy', 'terms_of_service', 'referral_terms')),
    version TEXT NOT NULL,
    content TEXT NOT NULL,
    requires_reconsent BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (type, version)
);

CREATE TABLE public.user_consent_records (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, document_type)
);

CREATE TABLE public.data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    download_url TEXT,
    expires_at TIMESTAMPTZ
);

-- =============================================================================
-- SECURITY & ANTI-ABUSE
-- =============================================================================

CREATE TABLE public.rate_limits (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('generation', 'upload', 'export', 'api_call')),
    count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_hours INTEGER NOT NULL DEFAULT 24,
    PRIMARY KEY (user_id, action_type)
);

CREATE TABLE public.blocked_emails (
    domain TEXT PRIMARY KEY,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT
);

CREATE TABLE public.blocked_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('trademark', 'nsfw', 'violence', 'hate')),
    action TEXT NOT NULL DEFAULT 'block' CHECK (action IN ('warn', 'block', 'flag_for_review')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    device_fingerprint TEXT,
    user_agent TEXT,
    ip_address TEXT,
    location TEXT,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_current BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================================================
-- FEEDBACK & ANNOUNCEMENTS
-- =============================================================================

CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bug', 'problem', 'suggestion', 'question', 'praise')),
    message TEXT NOT NULL,
    page_url TEXT,
    screenshot_url TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved', 'wont_fix')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('feature', 'update', 'maintenance', 'tip')),
    target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'pro', 'new_users')),
    is_dismissible BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE public.dismissed_announcements (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, announcement_id)
);

-- =============================================================================
-- REFERRAL PROGRAM
-- =============================================================================

CREATE TABLE public.referral_codes (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    referrals_count INTEGER NOT NULL DEFAULT 0,
    conversions_count INTEGER NOT NULL DEFAULT 0,
    rewards_earned INTEGER NOT NULL DEFAULT 0,
    terms_version TEXT NOT NULL,
    terms_accepted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_referral_codes_code ON public.referral_codes(code);

CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    referred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    converted BOOLEAN NOT NULL DEFAULT FALSE,
    converted_at TIMESTAMPTZ,
    reward_granted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE UNIQUE INDEX idx_referrals_referred ON public.referrals(referred_id);

-- =============================================================================
-- AMAZON KDP INTEGRATION (Future)
-- =============================================================================

CREATE TABLE public.kdp_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    book_title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    isbn TEXT,
    dimensions TEXT NOT NULL,
    interior_type TEXT NOT NULL CHECK (interior_type IN ('black_white', 'color')),
    cover_pdf_url TEXT,
    interior_pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coloring_studio_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_lab_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_creator_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monochrome_maker_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storybook_creator_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paint_by_numbers_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dismissed_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kdp_exports ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- User Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Project Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (
        user_id = auth.uid() 
        OR workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own projects" ON public.projects
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Image Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own images" ON public.images
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own images" ON public.images
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own images" ON public.images
    FOR DELETE USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Generation Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own generations" ON public.generations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create generations" ON public.generations
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Settings Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON public.user_settings
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Tool Data Policies (apply same pattern to all)
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage coloring_studio_data" ON public.coloring_studio_data
    FOR ALL USING (
        project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage hero_lab_data" ON public.hero_lab_data
    FOR ALL USING (
        project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage cover_creator_data" ON public.cover_creator_data
    FOR ALL USING (
        project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage monochrome_maker_data" ON public.monochrome_maker_data
    FOR ALL USING (
        project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage storybook_creator_data" ON public.storybook_creator_data
    FOR ALL USING (
        project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage paint_by_numbers_data" ON public.paint_by_numbers_data
    FOR ALL USING (
        project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
    );

-- -----------------------------------------------------------------------------
-- Workspace Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces
    FOR SELECT USING (
        owner_id = auth.uid() OR
        id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Owners can update their workspaces" ON public.workspaces
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Feature Flags (Admin only + public read for enabled flags)
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can view enabled feature flags" ON public.feature_flags
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- -----------------------------------------------------------------------------
-- Announcements (Public read)
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can view published announcements" ON public.announcements
    FOR SELECT USING (
        published_at <= NOW() AND (expires_at IS NULL OR expires_at > NOW())
    );

CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- -----------------------------------------------------------------------------
-- Feedback Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can create feedback" ON public.feedback
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own feedback" ON public.feedback
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all feedback" ON public.feedback
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- -----------------------------------------------------------------------------
-- Usage Tracking Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Referral Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own referral code" ON public.referral_codes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR SELECT USING (referrer_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Legal Documents (Public read)
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can view legal documents" ON public.legal_documents
    FOR SELECT USING (TRUE);

-- -----------------------------------------------------------------------------
-- User Consent Records
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage own consent" ON public.user_consent_records
    FOR ALL USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Data Requests
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage own data requests" ON public.data_requests
    FOR ALL USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Session Management
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
    FOR DELETE USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Dismissed Announcements
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage own dismissed announcements" ON public.dismissed_announcements
    FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Initial Feature Flags (all disabled)
INSERT INTO public.feature_flags (key, enabled, description) VALUES
    ('billing_enabled', FALSE, 'Show billing UI'),
    ('teams_enabled', FALSE, 'Show workspace features'),
    ('sharing_enabled', FALSE, 'Allow project sharing'),
    ('hero_lab_enabled', FALSE, 'Enable Hero Lab tool'),
    ('cover_creator_enabled', FALSE, 'Enable Cover Creator tool'),
    ('monochrome_maker_enabled', FALSE, 'Enable Monochrome Maker tool'),
    ('storybook_creator_enabled', FALSE, 'Enable Story Book Creator tool'),
    ('paint_by_numbers_enabled', FALSE, 'Enable Paint by Numbers tool'),
    ('kdp_export_enabled', FALSE, 'Enable Amazon KDP export'),
    ('referral_enabled', FALSE, 'Enable referral program'),
    ('maintenance_mode', FALSE, 'Show maintenance page'),
    ('feedback_enabled', TRUE, 'Enable feedback widget');

-- Common disposable email domains to block
INSERT INTO public.blocked_emails (domain, source) VALUES
    ('tempmail.com', 'initial_seed'),
    ('throwaway.email', 'initial_seed'),
    ('guerrillamail.com', 'initial_seed'),
    ('mailinator.com', 'initial_seed'),
    ('10minutemail.com', 'initial_seed'),
    ('fakeinbox.com', 'initial_seed'),
    ('trashmail.com', 'initial_seed');

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Generate unique public ID for projects (e.g., CB847291)
CREATE OR REPLACE FUNCTION generate_project_public_id(tool TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    new_id TEXT;
    exists_check BOOLEAN;
BEGIN
    -- Map tool types to prefixes
    prefix := CASE tool
        WHEN 'coloring_studio' THEN 'CB'
        WHEN 'hero_lab' THEN 'HL'
        WHEN 'cover_creator' THEN 'CC'
        WHEN 'monochrome_maker' THEN 'MM'
        WHEN 'storybook_creator' THEN 'SB'
        WHEN 'paint_by_numbers' THEN 'PN'
        ELSE 'XX'
    END;
    
    -- Generate unique ID
    LOOP
        new_id := prefix || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.projects WHERE public_id = new_id) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    
    RETURN new_id;
END;
$$ language 'plpgsql';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Next steps:
-- 1. Create storage buckets: avatars (public), projects (private), exports (private), feedback (private)
-- 2. Set up storage policies in Supabase Dashboard
-- 3. Configure auth providers (magic link email)
-- =============================================================================
