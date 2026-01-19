# Myjoe Creative Suite - Development Roadmap

> **Last Updated**: 2026-01-15  
> **Status**: Alpha

---

## ✅ Completed

### Infrastructure
- [x] Supabase project configured
- [x] Database schema designed (`supabase_schema.md`)
- [x] SQL migration ready (`001_initial_schema.sql`)
- [x] Cloudflare R2 storage client
- [x] Cloudflare Pages deployment
- [x] Magic link authentication (Supabase Auth)
- [x] Whitelist-based alpha access

### UI/Components
- [x] Landing page with auth
- [x] Dashboard
- [x] Coloring Book Studio (core generation)
- [x] Settings page
- [x] Navigation
- [x] Image edit chat panel

---

## 🔲 To Build

### Phase 1: Core Infrastructure (High Priority)

#### Run Supabase Migration
- [ ] Execute `001_initial_schema.sql` in Supabase SQL Editor
- [ ] Verify all tables created
- [ ] Confirm RLS policies active
- [ ] Seed whitelist users in `users` table

#### R2 Bucket Setup
- [ ] Create `myjoe-avatars` bucket (public)
- [ ] Create `myjoe-projects` bucket (private)
- [ ] Create `myjoe-exports` bucket (private)
- [ ] Create `myjoe-feedback` bucket (private)
- [ ] Configure CORS for all buckets
- [ ] Bind buckets in Pages dashboard

#### Supabase Auth Configuration
- [ ] Configure magic link email templates
- [ ] Set redirect URLs (`myjoe.co.uk/auth/callback`)
- [ ] Test magic link flow end-to-end

---

### Phase 2: User Features (Medium Priority)

#### Feedback Widget
> Schema: `feedback` table
- [ ] Floating feedback button component
- [ ] Feedback modal (type selector: bug/suggestion/question/praise)
- [ ] Screenshot capture (optional)
- [ ] Submit to Supabase + screenshot to R2
- [ ] Success/error toast notifications

#### Announcements Banner
> Schema: `announcements`, `dismissed_announcements` tables
- [ ] Fetch active announcements from Supabase
- [ ] Dismissible banner component
- [ ] Track dismissed state per user
- [ ] Support multiple announcement types (feature/update/maintenance/tip)

#### User Profile
> Schema: `users` table
- [ ] Avatar upload (to R2 `avatars` bucket)
- [ ] Display name editing
- [ ] Timezone/locale preferences
- [ ] Account deletion request

#### Session Management
> Schema: `user_sessions` table
- [ ] Display active sessions in settings
- [ ] Show device/location/last active
- [ ] Revoke sessions remotely

---

### Phase 3: Projects & Storage (Medium Priority)

#### Project Management
> Schema: `projects` table
- [ ] Create project with `public_id` generation (e.g., `CB847291`)
- [ ] Project listing on dashboard
- [ ] Project rename/archive
- [ ] Cover image from first generation

#### Image Persistence
> Schema: `images` table
- [ ] Save generated images to R2
- [ ] Store metadata in Supabase
- [ ] Image version history (`parent_image_id`)
- [ ] Lazy-load images with signed URLs

#### Generation History
> Schema: `generations` table
- [ ] Log all AI generations
- [ ] Track prompt, settings, duration
- [ ] Link to result image
- [ ] View past generations per project

---

### Phase 4: Usage & Billing (Lower Priority)

#### Usage Tracking
> Schema: `usage_tracking` table
- [ ] Track generations per month
- [ ] Track storage used
- [ ] Display usage in settings/dashboard
- [ ] Warn when approaching limits

#### Plan Limits Enforcement
> Schema: Plan limits in `supabase_schema.md`
- [ ] Check plan limits before generation
- [ ] Show upgrade prompt when limit reached
- [ ] Different limits per plan (free/starter/pro/team)

#### Stripe Integration
> Schema: `stripe_customer_id` in `users`
- [ ] Stripe checkout for upgrades
- [ ] Webhook for subscription events
- [ ] Portal for managing subscription
- [ ] Invoice history

---

### Phase 5: Additional Tools (Future)

> Schema: Tool-specific data tables

#### Hero Lab
> `hero_lab_data` table
- [ ] Character creation interface
- [ ] Pose/style selection
- [ ] Art style options

#### Cover Creator
> `cover_creator_data` table
- [ ] Book title/author input
- [ ] Genre selection
- [ ] Dimension presets (6x9, 8.5x11, etc.)
- [ ] Spine text

#### Monochrome Maker
> `monochrome_maker_data` table
- [ ] Image upload
- [ ] Contrast/style controls
- [ ] Preview before save

#### Story Book Creator
> `storybook_creator_data` table
- [ ] Story theme selection
- [ ] Character definitions
- [ ] Page-by-page generation

#### Color by Numbers
> `color_by_numbers_data` table
- [ ] Photo upload
- [ ] Color count selection
- [ ] Difficulty presets
- [ ] Numbered output generation

---

### Phase 6: Admin & Security (Lower Priority)

#### Admin Panel
> Schema: `feature_flags`, `admin_audit_log` tables
- [ ] Feature flag management
- [ ] View/search users
- [ ] Review feedback
- [ ] Manage announcements
- [ ] View security events

#### Content Moderation
> Schema: `blocked_content`, `blocked_emails` tables
- [ ] Prompt filtering before generation
- [ ] Block disposable email signups
- [ ] Flag suspicious activity

---

### Phase 7: Compliance (Required for Public Launch)

#### Cookie Consent
> Schema: `cookie_consent` table
- [ ] Cookie banner component
- [ ] Granular consent (essential/functional/analytics/marketing)
- [ ] Store consent records

#### Legal Documents
> Schema: `legal_documents`, `user_consent_records` tables
- [ ] Terms of Service page
- [ ] Privacy Policy page
- [ ] Track user acceptance
- [ ] Require re-consent on major changes

#### GDPR Data Requests
> Schema: `data_requests` table
- [ ] "Download my data" in settings
- [ ] "Delete my account" flow
- [ ] 30-day grace period
- [ ] Email confirmation

---

### Phase 8: Growth Features (Post-Launch)

#### Referral Program
> Schema: `referral_codes`, `referrals` tables
- [ ] Generate unique referral codes
- [ ] Track signups from referrals
- [ ] Reward on conversion
- [ ] Referral dashboard

#### Workspaces/Teams
> Schema: `workspaces`, `workspace_members` tables
- [ ] Create workspace
- [ ] Invite members via email
- [ ] Role management (owner/admin/editor/viewer)
- [ ] Shared project access

#### Amazon KDP Export
> Schema: `kdp_exports` table
- [ ] KDP-ready PDF generation
- [ ] Cover + interior bundles
- [ ] Dimension presets for KDP
- [ ] ISBN field (optional)

---

## Priority Summary

| Priority | Items | Est. Effort |
|----------|-------|-------------|
| **P0** | Run migration, R2 buckets, auth redirect | 1 day |
| **P1** | Feedback widget, announcements | 2-3 days |
| **P2** | Project persistence, image storage | 3-5 days |
| **P3** | Usage tracking, plan limits | 2-3 days |
| **P4** | Additional tools (5 tools) | 2-3 weeks |
| **P5** | Billing, admin, compliance | 1-2 weeks |

---

## Quick Wins (Can Build Today)

1. **Feedback Widget** - Simple form → Supabase insert
2. **Announcements** - Fetch + display banner
3. **User Avatar** - Upload to R2, save URL to users table
4. **Usage Display** - Query `generations` count for current month

---

*Reference: [supabase_schema.md](./architecture/supabase_schema.md)*
