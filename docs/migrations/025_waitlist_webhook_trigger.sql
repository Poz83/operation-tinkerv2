-- ============================================================================
-- Migration 025: Waitlist Webhook Trigger
-- ============================================================================
-- Creates a PostgreSQL trigger that calls the Edge Function via pg_net
-- when a new row is inserted into the waitlist table.
-- ============================================================================

-- Enable pg_net extension for HTTP calls (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to call Edge Function via HTTP
CREATE OR REPLACE FUNCTION public.notify_waitlist_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
  edge_function_url TEXT;
  request_id BIGINT;
BEGIN
  -- Get Supabase URL from app settings or use the known project URL
  -- In production, set these via: ALTER DATABASE postgres SET app.supabase_url = 'https://xxx.supabase.co';
  supabase_url := coalesce(
    current_setting('app.supabase_url', true),
    'https://jjlbdzwuhvupggfhhxiz.supabase.co'
  );
  
  service_key := current_setting('app.supabase_service_role_key', true);
  
  -- Construct the Edge Function URL
  edge_function_url := supabase_url || '/functions/v1/send-waitlist-welcome';
  
  -- Make async HTTP POST to Edge Function
  -- Note: If service_key is not set, the function will need to handle anon auth
  SELECT extensions.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(service_key, '')
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
  
  -- Log for debugging (visible in Postgres logs)
  RAISE LOG 'Waitlist webhook triggered for email: %, request_id: %', NEW.email, request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the INSERT if webhook fails
    RAISE WARNING 'Waitlist webhook failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger that fires AFTER INSERT
DROP TRIGGER IF EXISTS on_waitlist_insert ON public.waitlist;

CREATE TRIGGER on_waitlist_insert
AFTER INSERT ON public.waitlist
FOR EACH ROW
EXECUTE FUNCTION public.notify_waitlist_insert();

-- Add comment
COMMENT ON FUNCTION public.notify_waitlist_insert() IS 
'Trigger function that calls the send-waitlist-welcome Edge Function via HTTP when a new waitlist entry is created';
