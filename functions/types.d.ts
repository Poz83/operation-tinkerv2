/// <reference types="@cloudflare/workers-types" />

declare interface Env {
    PROJECTS_BUCKET: R2Bucket;
    AVATARS_BUCKET: R2Bucket;
    EXPORTS_BUCKET: R2Bucket;
    FEEDBACK_BUCKET: R2Bucket;

    // Variables from screenshot
    CLOUDFLARE_ACCOUNT_ID: string;
    CLOUDFLARE_R2_ACCESS_KEY_ID: string;
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: string;
    GEMINI_API_KEY: string;
    VITE_APP_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    VITE_SUPABASE_URL: string;
}
