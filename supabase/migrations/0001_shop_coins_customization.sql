-- ============================================================
-- migration 0001 — coins, shop & customization
-- run this in your supabase SQL editor on an EXISTING database
-- (schema.sql already includes these for fresh installs)
-- ============================================================

-- ── economy + customization columns on pets ──────────────────
alter table public.pets
  add column if not exists coins       integer default 50 check (coins >= 0),
  add column if not exists owned_items jsonb   default '[]'::jsonb,
  add column if not exists equipped    jsonb   default '{}'::jsonb;

-- backfill any rows that predate the columns
update public.pets set coins       = 50          where coins       is null;
update public.pets set owned_items = '[]'::jsonb where owned_items is null;
update public.pets set equipped    = '{}'::jsonb where equipped    is null;

-- ── widen the pet_action enum ────────────────────────────────
-- treat/hug actions already existed in the app but were missing here;
-- shop/game power the new event types. (add value is idempotent.)
alter type pet_action add value if not exists 'treat';
alter type pet_action add value if not exists 'hug';
alter type pet_action add value if not exists 'shop';
alter type pet_action add value if not exists 'game';
