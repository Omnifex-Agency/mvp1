-- HighlightAgent Schema
-- Run this in the Supabase SQL Editor

-- 1. Create Alerts Table
create table if not exists alerts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_email text not null,
  title text not null,
  content text not null,
  source_url text,
  format text not null default 'summary', -- 'full', 'summary', 'quiz'
  reminder_date date not null,
  status text not null default 'scheduled', -- 'scheduled', 'sent'
  sent_at timestamp with time zone,
  timezone text default 'UTC'
);

-- 2. Create Indexes for Performance
-- Fast lookup for dashboard list by user
create index if not exists idx_alerts_user_email on alerts(user_email);

-- Fast lookup for the daily scheduler (filtering by date and status)
create index if not exists idx_alerts_due on alerts(reminder_date, status);

-- 3. Row Level Security (RLS) Policies
-- Since this is an MVP without Authentication, we enable RLS but create permissive policies.
-- In a real production app, you would restrict matching (user_email = auth.email()).

alter table alerts enable row level security;

-- Policy: Allow anyone to insert a new alert (Extension Usage)
create policy "Allow Insert Public" 
on alerts 
for insert 
with check (true);

-- Policy: Allow anyone to reading/updating/deleting rows (Dashboard Usage)
-- Ideally this should match query params, but standard RLS doesn't see API params easily
-- without a custom function. For MVP 'Email Identity', we allow public access.
-- The client-side app filters by ?user_email.
create policy "Enable All for Public" 
on alerts 
for all 
using (true) 
with check (true);
