-- ============================================================================
-- Migration 027: Fix Waitlist Webhook Trigger
-- ============================================================================
-- Purpose: Hardcode Service Key in the trigger to ensure Edge Function is called
-- correctly, bypassing potential missing 'app.supabase_service_role_key' setting.
-- 
-- WARNING: This exposes the Service Key in the database function definition.
-- This is acceptable for this development context but ideally use Vault or Secrets.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_waitlist_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  edge_function_url TEXT := 'https://jjlbdzwuhvupggfhhxiz.supabase.co/functions/v1/send-waitlist-welcome';
  service_key TEXT := 'sb_secret_Euev4EVrPbpBki2sxOu0BQ_tPr5cXFY'; -- Hardcoded from .env.local
  request_id BIGINT;
BEGIN
  -- Log trigger attempt
  RAISE LOG 'Attempting to trigger waitlist webhook for: %', NEW.email;

  -- Make async HTTP POST to Edge Function
  SELECT extensions.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'waitlist',
      'record', jsonb_build_object(
        'id', NEW.id::text,
        'full_name', NEW.full_name,
        'email', NEW.email,
        'created_at', NEW.created_at::text
      )
    )
  ) INTO request_id;
  
  -- Log success
  RAISE LOG 'Waitlist webhook request sent. Request ID: %', request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Waitlist webhook failed: %', SQLERRM;
    RETURN NEW;
END;
$$;
