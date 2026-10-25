-- ==============================================================================
-- STORYTIME — SUPABASE SCHEMA
-- Target: family project https://twvqvutrcobedvuhnzxq.supabase.co
-- Run once in the Supabase SQL Editor. Only adds storytime_ tables;
-- reads family_members from Family Habits but never changes it.
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- 1. Saved stories (one row per story)
create table if not exists public.storytime_stories (
    id uuid primary key default uuid_generate_v4(),
    member_name text not null references public.family_members(name) on update cascade on delete cascade,
    level text not null default 'K',
    name text not null,
    created_at timestamp with time zone not null default timezone('utc'::text, now()),
    duration_sec integer not null default 0,
    spinners jsonb not null default '{}'::jsonb,     -- {"Tone": {"zh": "开心", "en": "happy"}, ...}
    seed jsonb,                                       -- {"id", "zh", "en", "level"}
    transcript text not null default '',
    keywords text[] not null default '{}',
    tags text[] not null default '{}',
    decisions jsonb not null default '[]'::jsonb,     -- [{"point", "type", "options", "choice"}]
    updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists storytime_stories_member_idx on public.storytime_stories (member_name, created_at desc);

-- 2. Per-member default reading level
create table if not exists public.storytime_member_settings (
    member_name text primary key references public.family_members(name) on update cascade on delete cascade,
    level text not null default 'K',
    updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 3. Row Level Security: signed-in family login has full access (same as Family Habits)
alter table public.storytime_stories enable row level security;
alter table public.storytime_member_settings enable row level security;

create policy "Authenticated can manage storytime_stories"
on public.storytime_stories for all to authenticated using (true) with check (true);

create policy "Authenticated can manage storytime_member_settings"
on public.storytime_member_settings for all to authenticated using (true) with check (true);
