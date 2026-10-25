-- ==============================================================================
-- STORYTIME — AI KEY TABLE
-- Target: family project https://twvqvutrcobedvuhnzxq.supabase.co
-- Run once in the Supabase SQL Editor (after schema.sql).
--
-- WHAT YOU NEED FROM GOOGLE AI STUDIO:
--   ✅ The API key only (starts with "AIza...").
--   ❌ Not the project name, not the project number, not a password.
--
-- The table holds exactly one row with one column: the key.
-- Row Level Security is ON with NO policies, so the website (anon or signed-in
-- user) cannot read it. Only the Edge Function, which uses the service role,
-- can read the key.
--
-- Optional, in Supabase Edge Functions > Secrets (not in this file):
--   GEMINI_MODEL = the model name shown on the AI Studio pricing page.
--   Leave it unset to use the default in supabase/functions/ai/index.ts.
-- ==============================================================================

create table if not exists public.storytime_ai_key (
    id smallint primary key default 1 check (id = 1),  -- one row only
    api_key text not null
);

alter table public.storytime_ai_key enable row level security;
-- (no policies on purpose: nobody in the browser can read or write this table)

-- ------------------------------------------------------------------------------
-- STEP 2 — add the key. Run this ONCE, then clear it from the editor history:
-- ------------------------------------------------------------------------------
-- insert into public.storytime_ai_key (id, api_key)
-- values (1, 'PASTE_YOUR_AIza_KEY_HERE')
-- on conflict (id) do update set api_key = excluded.api_key;
--
-- To replace the key later, run the same statement with the new key.
-- To remove it:  delete from public.storytime_ai_key;
