-- ============================================================
-- tamago schema
-- run this in your supabase sql editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── users ────────────────────────────────────────────────────
-- supabase auth.users already exists; we extend it with a profile
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── pets ─────────────────────────────────────────────────────
create type pet_stage as enum ('egg', 'baby', 'child', 'teen', 'adult');

create table public.pets (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade,
  name         text not null,
  stage        pet_stage default 'egg',

  -- stats: 0–100
  hunger       integer default 80 check (hunger between 0 and 100),
  happy        integer default 80 check (happy between 0 and 100),
  clean        integer default 100 check (clean between 0 and 100),
  energy       integer default 80 check (energy between 0 and 100),

  -- progression
  xp           integer default 0,
  born_at      timestamptz default now(),
  last_decay   timestamptz default now(),  -- when decay last ran
  last_visit   timestamptz default now(),

  -- soft-delete / death
  is_alive     boolean default true,

  created_at   timestamptz default now()
);

alter table public.pets enable row level security;

create policy "users can read own pets"
  on public.pets for select
  using (auth.uid() = user_id);

create policy "users can update own pets"
  on public.pets for update
  using (auth.uid() = user_id);

create policy "users can insert own pets"
  on public.pets for insert
  with check (auth.uid() = user_id);

-- public read for shareable pet pages (anyone can view, not edit)
create policy "public can read pets"
  on public.pets for select
  using (true);


-- ── pet events ───────────────────────────────────────────────
create type pet_action as enum ('feed', 'play', 'clean', 'sleep', 'decay', 'evolve');

create table public.pet_events (
  id         uuid primary key default uuid_generate_v4(),
  pet_id     uuid references public.pets(id) on delete cascade,
  action     pet_action not null,
  delta      jsonb,           -- e.g. {"hunger": 20, "happy": -5}
  ts         timestamptz default now()
);

alter table public.pet_events enable row level security;

create policy "users can read own pet events"
  on public.pet_events for select
  using (
    exists (
      select 1 from public.pets
      where pets.id = pet_events.pet_id
        and pets.user_id = auth.uid()
    )
  );

-- index for fast event log queries
create index on public.pet_events (pet_id, ts desc);
