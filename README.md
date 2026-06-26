# tamago 🐣

a kawaii persistent web tamagotchi. your pet lives on a server and ages in real time — hungry if you don't visit, excited when you do.

## stack

- **Next.js 14** (app router, typescript)
- **Supabase** (postgres + auth)
- **Vercel** (hosting + cron jobs)

## setup

### 1. install

```bash
npx create-next-app@latest tamago --typescript --tailwind --app
cd tamago
npm install @supabase/supabase-js @supabase/ssr
```

### 2. supabase

1. create a project at [supabase.com](https://supabase.com)
2. run the sql in `supabase/schema.sql` in the supabase sql editor
3. copy your project url and anon key

### 3. env

create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=any_random_string_you_make_up
```

### 4. run

```bash
npm run dev
```

## project structure

```
src/
  app/
    page.tsx                 ← home / pet page
    auth/page.tsx            ← login / signup
    pet/[id]/page.tsx        ← public shareable pet page
    api/
      pet/route.ts           ← create / get pet
      action/route.ts        ← feed, play, clean, sleep
      cron/route.ts          ← hourly stat decay (called by vercel cron)
  components/
    PetDisplay.tsx           ← animated SVG pet
    StatBars.tsx             ← hunger / happy / clean / energy bars
    ActionButtons.tsx        ← feed / play / clean / sleep buttons
  lib/
    supabase/
      client.ts              ← browser supabase client
      server.ts              ← server supabase client
    pet.ts                   ← pet stat logic (decay, evo, xp)
  types/
    pet.ts                   ← shared typescript types
supabase/
  schema.sql                 ← run this in supabase sql editor
```

## deploying to vercel

1. push to github, connect to vercel
2. add all env vars in vercel dashboard
3. add `vercel.json` cron config (already included)
4. the cron hits `/api/cron` every hour with `Authorization: Bearer $CRON_SECRET`
