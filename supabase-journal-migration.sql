-- Migration: Create journal tables for /diario energy diary
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Journal entries (one per day per user)
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  text text not null,
  energy_level float,
  tone text,
  tone_emoji text,
  themes text[],
  celebrations text[],
  ai_reflection text,
  ai_suggestions jsonb,
  source text default 'text',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- 2. Energy trackers (preset + AI-suggested items to track)
create table energy_trackers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  label text not null,
  emoji text,
  category text,
  is_preset boolean default false,
  archived boolean default false,
  created_at timestamptz default now()
);

-- 3. Tracker check-ins (one per tracker per day)
create table tracker_checkins (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid references energy_trackers on delete cascade not null,
  user_id uuid references auth.users not null,
  date date not null,
  done boolean default true,
  unique(tracker_id, date)
);

-- RLS: Enable row-level security
alter table journal_entries enable row level security;
alter table energy_trackers enable row level security;
alter table tracker_checkins enable row level security;

-- RLS Policies: Users can only access their own data
create policy "Users can read own journal entries"
  on journal_entries for select using (auth.uid() = user_id);
create policy "Users can insert own journal entries"
  on journal_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own journal entries"
  on journal_entries for update using (auth.uid() = user_id);

create policy "Users can read own trackers"
  on energy_trackers for select using (auth.uid() = user_id);
create policy "Users can insert own trackers"
  on energy_trackers for insert with check (auth.uid() = user_id);
create policy "Users can update own trackers"
  on energy_trackers for update using (auth.uid() = user_id);
create policy "Users can delete own trackers"
  on energy_trackers for delete using (auth.uid() = user_id);

create policy "Users can read own checkins"
  on tracker_checkins for select using (auth.uid() = user_id);
create policy "Users can insert own checkins"
  on tracker_checkins for insert with check (auth.uid() = user_id);
create policy "Users can update own checkins"
  on tracker_checkins for update using (auth.uid() = user_id);
create policy "Users can delete own checkins"
  on tracker_checkins for delete using (auth.uid() = user_id);

-- Index for fast calendar queries
create index idx_journal_entries_user_date on journal_entries(user_id, date);
create index idx_tracker_checkins_user_date on tracker_checkins(user_id, date);
