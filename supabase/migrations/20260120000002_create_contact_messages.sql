-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store honeypot status or other info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anyone can send a message)
DROP POLICY IF EXISTS "Allow public insert to contact_messages" ON public.contact_messages;
CREATE POLICY "Allow public insert to contact_messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (length(message) > 0);

-- Only service role can read (for admin dashboard/email trigger)
DROP POLICY IF EXISTS "Allow service_role read contact_messages" ON public.contact_messages;
CREATE POLICY "Allow service_role read contact_messages"
ON public.contact_messages
FOR SELECT
TO service_role
USING (true);

-- Grant permissions
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT ON public.contact_messages TO service_role;
