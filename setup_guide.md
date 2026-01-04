
# Setup Guide & Credentials Checklist

## 1. Credentials Needed
You need to set these in your **Supabase Project Settings -> Edge Functions -> Secrets**.

| Key | Description |
| :--- | :--- |
| `BREVO_API_KEY` | **Required**: API Key from Brevo (Sendinblue) for sending transactional emails. |
| `SUPABASE_URL` | Check Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Critical**: Allows Edge Function to bypass RLS to query all users. Found in Project Settings -> API. |

Run this command locally to set them (if using Supabase CLI):
```bash
supabase secrets set BREVO_API_KEY=xkeysib-12345...
```

---

## 2. Database Setup (SQL)
Run this inside Supabase **SQL Editor** to create the schema.

```sql
-- 1. Create Table
create table alerts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_email text not null,
  title text not null,
  content text not null,
  source_url text,
  format text not null default 'summary',
  reminder_date date not null,
  status text not null default 'scheduled',
  sent_at timestamp with time zone,
  timezone text default 'UTC'
);

-- 2. Indexes
create index idx_alerts_user_email on alerts(user_email);
create index idx_alerts_due on alerts(reminder_date, status);

-- 3. RLS Policies (For MVP "Email Identity" Security)
alter table alerts enable row level security;

-- Policy: Allow Insert for anyone (Public Save)
create policy "Allow Insert Public" on alerts for insert with check (true);

-- Policy: Allow Select/Delete Only Matching Email (Weak Security but MVP Compliant)
-- Note: Since we don't have Auth users, we rely on client sending user_email filter.
-- A true "Secure" app needs Supabase Auth. For MVP "Implicit Trust", we might just enable ALL for public.
-- RECOMMENDATION FOR MVP:
create policy "Enable All for Public" on alerts for all using (true) with check (true);
```

---

## 3. Cron Job Configuration
To run the Edge Function daily at 9:00 AM UTC.

1. Go to **Supabase Dashboard -> Integrations -> Cron**.
2. Or run this SQL:

```sql
select
  cron.schedule(
    'send-due-alerts-daily',
    '0 9 * * *', -- At 09:00 AM
    $$
    select
      net.http_post(
          url:='https://project-ref.functions.supabase.co/send-due-alerts',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );
```
*(Note: managed Supabase Cron is the easiest way. Alternatively, use a GitHub Action or external cron).*

---

## 4. Manual Test Plan

1. **Extension**: Open a page, select text, click "Save". Choose "Tomorrow".
2. **Dashboard**: Open `localhost:3000`. Login with same email. Verify alert is visible in "Pending".
3. **DB Check**: In Supabase Table Editor, manually edit the `reminder_date` of that row to `Today` (e.g. `2026-01-04`).
4. **Trigger Function**:
   - `curl -i --location --request POST 'https://<project>.functions.supabase.co/send-due-alerts' --header 'Authorization: Bearer <ANON_KEY>'`
5. **Verify**:
   - Check Console Logs in Supabase.
   - Check Email Inbox (if Resend key active).
   - Check Dashboard: Alert should move to "Sent" stats.
