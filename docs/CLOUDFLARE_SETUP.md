# Cloudflare Setup Guide for Myjoe

This guide will walk you through setting up Cloudflare Pages and R2 for your Myjoe application.

---

## Part 1: Create R2 Buckets

### Step 1: Access R2

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **R2** in the left sidebar
3. If this is your first time, accept the R2 terms

### Step 2: Create Buckets

Create **4 buckets** with these exact names (they must match `wrangler.toml`):

**Bucket 1: myjoe-avatars** (Public)
- Click **Create bucket**
- Name: `myjoe-avatars`
- Location: **Automatic** (recommended)
- After creation:
  - Go to bucket → **Settings** → **Public Access**
  - Enable **Allow Access** (this makes avatars publicly accessible)

**Bucket 2: myjoe-projects** (Private)
- Click **Create bucket**
- Name: `myjoe-projects`
- Location: **Automatic**
- Keep private (no public access)

**Bucket 3: myjoe-exports** (Private)
- Click **Create bucket**
- Name: `myjoe-exports`
- Location: **Automatic**
- Keep private

**Bucket 4: myjoe-feedback** (Private)
- Click **Create bucket**
- Name: `myjoe-feedback`
- Location: **Automatic**
- Keep private

### Step 3: Configure CORS (Optional - for direct browser uploads)

For each bucket, go to **Settings** → **CORS Policy** and add:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "https://myjoe.co.uk"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Part 2: Connect GitHub to Cloudflare Pages

### Step 1: Create Cloudflare Pages Project

1. In Cloudflare Dashboard, click **Pages** in the left sidebar
2. Click **Create application** → **Pages** → **Connect to Git**
3. Click **Connect GitHub**
4. Authorize Cloudflare to access your GitHub
5. Select your repository: `Poz83/operation-tinkerv2`
6. Click **Begin setup**

### Step 2: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Production branch** | `master` (or `main` if that's your default) |
| **Framework preset** | **Vite** |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (leave empty) |

### Step 3: Environment Variables (Build)

Click **+ Add variable** for each:

```
VITE_APP_URL=https://myjoe.co.uk
VITE_SUPABASE_URL=https://jjlbdzwuhvupggfhhxiz.supabase.co
VITE_SUPABASE_ANON_KEY=[your anon key from Supabase]
VITE_GEMINI_API_KEY=[your Gemini API key]
```

> **Note:** Only `VITE_*` prefixed variables are exposed to the frontend build.

Click **Save and Deploy**

---

## Part 3: Bind R2 Buckets to Pages

After your first deployment completes:

### Step 1: Go to Settings

1. Go to your Pages project
2. Click **Settings** → **Functions**
3. Scroll to **R2 bucket bindings**

### Step 2: Add Bindings

Click **Add binding** for each bucket:

| Variable name | R2 bucket | R2 bucket name |
|---------------|-----------|----------------|
| `R2_AVATARS` | (select from dropdown) | `myjoe-avatars` |
| `R2_PROJECTS` | (select from dropdown) | `myjoe-projects` |
| `R2_EXPORTS` | (select from dropdown) | `myjoe-exports` |
| `R2_FEEDBACK` | (select from dropdown) | `myjoe-feedback` |

> **CRITICAL:** The variable names must match exactly (`R2_AVATARS`, `R2_PROJECTS`, etc.) as they're used in the Pages Functions code.

Click **Save**

---

## Part 4: Configure Custom Domain

### Step 1: Add Domain

1. In your Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `myjoe.co.uk`
4. Click **Continue**

### Step 2: DNS Configuration

Cloudflare will show you the DNS records to add:

**If your domain is already on Cloudflare:**
- Cloudflare will automatically create the CNAME record
- Wait a few minutes for it to activate

**If your domain is NOT on Cloudflare:**
- You'll need to add a CNAME record at your DNS provider:
  - Type: `CNAME`
  - Name: `@` (or your subdomain)
  - Value: `[your-project].pages.dev`

### Step 3: Wait for SSL

- SSL certificates are issued automatically
- Usually takes 1-5 minutes
- Status will show "Active" when ready

---

## Part 5: Configure Supabase Auth Redirects

### Step 1: Update Auth URLs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/jjlbdzwuhvupggfhhxiz)
2. Click **Authentication** → **URL Configuration**

### Step 2: Add Site URLs

**Site URL:**
```
https://myjoe.co.uk
```

**Redirect URLs:**
```
http://localhost:5173/auth/callback
https://myjoe.co.uk/auth/callback
```

Add both localhost (for development) and production.

### Step 3: Configure Email Templates (Optional)

Go to **Authentication** → **Email Templates** to customize:
- Magic Link email
- Confirmation email

Make sure the redirect URL in emails points to your domain.

---

## Part 6: Run Supabase Migration

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/jjlbdzwuhvupggfhhxiz)
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Run Migration

1. Open `docs/migrations/001_initial_schema.sql` from your project
2. Copy the **entire file** contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl + Enter`)

**Expected result:** You should see output like:
```
Success. No rows returned
```

This creates all your database tables, RLS policies, and seed data.

### Step 3: Verify Tables

1. Click **Table Editor** in the left sidebar
2. You should see all your tables:
   - users
   - projects
   - images
   - generations
   - user_settings
   - feature_flags
   - feedback
   - announcements
   - etc.

---

## Part 7: Test Your Deployment

### Step 1: Visit Your Site

Go to `https://myjoe.co.uk` (or `https://[your-project].pages.dev`)

### Step 2: Test Magic Link Auth

1. Click **Sign In with Magic Link**
2. Enter: `jamie@myjoe.app` or `stuff.araza@gmail.com`
3. Check your email for the magic link
4. Click the link → should redirect to dashboard

### Step 3: Verify R2 Upload (When You Build Upload UI)

Once you integrate the storage client, test:
- Upload an avatar
- Upload a project image
- Download a private file

---

## Part 8: Monitoring & Logs

### Cloudflare Pages Logs

**Real-time function logs:**
1. Go to your Pages project
2. Click **Functions**
3. View logs for any errors in R2 uploads/downloads

**Analytics:**
1. Go to **Analytics** tab
2. View:
   - Requests per second
   - Bandwidth usage
   - Error rates

### Supabase Logs

**Database queries:**
1. Go to Supabase Dashboard → **Logs** → **Postgres Logs**
2. See all SQL queries and errors

**Auth logs:**
1. **Logs** → **Auth Logs**
2. Track login attempts, magic link sends

---

## Part 9: Environment Variable Reference

### Frontend (Build-time - add to Cloudflare Pages)

```bash
VITE_APP_URL=https://myjoe.co.uk
VITE_SUPABASE_URL=https://jjlbdzwuhvupggfhhxiz.supabase.co
VITE_SUPABASE_ANON_KEY=[from Supabase]
VITE_GEMINI_API_KEY=[from Google AI Studio]
```

### Backend (R2 - configured via bindings, not env vars)

R2 buckets are bound directly to the Pages Functions, no environment variables needed.

---

## Common Issues & Troubleshooting

### Issue: "Magic link expired or invalid"

**Solution:**
- Check Supabase redirect URLs include your domain
- Verify `VITE_APP_URL` matches your actual domain
- Check that magic link email hasn't expired (default: 1 hour)

### Issue: R2 upload fails with "Bucket not found"

**Solution:**
- Verify R2 bucket bindings in Pages Settings → Functions
- Check bucket names match exactly: `myjoe-avatars`, `myjoe-projects`, etc.
- Redeploy after adding bindings

### Issue: Build fails

**Solution:**
- Check build logs in Cloudflare Pages deployment
- Ensure all `VITE_*` environment variables are set
- Verify `npm run build` works locally

### Issue: "Cannot find module '@supabase/supabase-js'"

**Solution:**
- Ensure `package-lock.json` is committed to git
- Check that Cloudflare is running `npm install` (not `npm ci`)

---

## Next Steps

✅ **Your infrastructure is ready!**

Now you can:
1. Start using `storage.uploadImage()` in your components
2. Store generated images in R2
3. Track projects in Supabase
4. Add usage tracking for billing

Need help integrating storage into your existing components? Let me know!
