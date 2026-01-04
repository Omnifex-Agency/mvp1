
-- Phase 2 Security & Automation Setup
-- Run this in Supabase SQL Editor

-- 1. ADD USER_ID COLUMN (Migration)
-- We add user_id to link alerts to Supabase Auth Users securely.
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- 3. CREATE POLICIES
-- Policy: Users can only see their own alerts
CREATE POLICY "Users can view own alerts" ON alerts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own alerts
-- Note: browser extension might be 'anon', so we might keep 'Allow Insert Public' for now 
-- OR strictly enforce it. For 'Principal' level, we enforce, assuming Extension authenticates.
-- *However*, since MVP Extension is unauth, we keep the Public Insert active but restrict Select.

CREATE POLICY "Users can insert own alerts" ON alerts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON alerts
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON alerts
    FOR DELETE
    USING (auth.uid() = user_id);


-- 4. EMAIL SCHEDULER (PG_CRON)
-- Ensure the extension is enabled (Supabase Settings -> Database -> Extensions -> pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function to run every day at 9:00 AM UTC
-- Replace PROJECT_REF and ANON_KEY with actual values if running strictly sql or use UI
-- Best way is to just call the HTTP endpoint of the function.

SELECT cron.schedule(
    'daily-reminders', -- name of the cron job
    '0 9 * * *',       -- every day at 09:00
    $$
    select
        net.http_post(
            url:='https://ztwcpkaunjtaftvdirqd.supabase.co/functions/v1/send-daily-reminders',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
            body:='{}'::jsonb
        ) as request_id;
    $$
);
