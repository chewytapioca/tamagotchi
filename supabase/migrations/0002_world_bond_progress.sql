-- ============================================================
-- migration 0002 — bond, inventory, achievements, events
-- run this in your supabase SQL editor on an EXISTING database
-- ============================================================

alter table public.pets
  add column if not exists affection    integer     default 0 check (affection >= 0),
  add column if not exists inventory     jsonb       default '{}'::jsonb,   -- {"food_strawberry": 3}
  add column if not exists counters      jsonb       default '{}'::jsonb,   -- {"feed": 12}
  add column if not exists achievements  jsonb       default '[]'::jsonb,   -- ["first_evolution"]
  add column if not exists last_event    timestamptz default now();

-- backfill rows that predate the columns
update public.pets set affection    = 0             where affection    is null;
update public.pets set inventory     = '{}'::jsonb  where inventory     is null;
update public.pets set counters      = '{}'::jsonb  where counters      is null;
update public.pets set achievements  = '[]'::jsonb  where achievements  is null;
update public.pets set last_event    = now()        where last_event    is null;
