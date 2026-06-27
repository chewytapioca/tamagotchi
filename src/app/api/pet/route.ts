import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMood, applyDecay } from '@/lib/pet'
import { newlyUnlocked } from '@/lib/progress'
import { eventReady, rollEvent } from '@/lib/events'
import { STARTER_INVENTORY } from '@/lib/favorites'
import type { Pet } from '@/types/pet'

const OFFLINE_THRESHOLD_MS = 15 * 60 * 1000  // show an "away" summary past 15 min

// GET /api/pet — get the current user's pet (applies decay + surprises on visit)
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  const { data: pet, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_alive', true)
    .single()

  if (error || !pet) {
    return NextResponse.json({ pet: null })
  }

  const now = new Date()
  const awayMs = now.getTime() - new Date(pet.last_visit).getTime()
  const wasAway = awayMs > OFFLINE_THRESHOLD_MS

  const updates: Partial<Pet> = { last_visit: now.toISOString() }

  // only settle decay when the player was genuinely away — otherwise the
  // 30s poll would reset last_decay every tick and stall it (and fight cron).
  let delta: Record<string, number> = {}
  if (wasAway) {
    const decayed = applyDecay(pet as Pet)
    Object.assign(updates, decayed.updates)
    delta = decayed.delta as Record<string, number>
  }

  // occasional surprise event (coins / gift), gated by a cooldown
  let event = null
  if (eventReady(pet.last_event, now)) {
    const rolled = rollEvent(now)
    if (rolled) {
      event = rolled
      updates.coins = (pet.coins ?? 0) + rolled.coins
      updates.last_event = now.toISOString()
    }
  }

  // achievements that may now be satisfied
  const candidate = { ...(pet as Pet), ...updates } as Pet
  const unlocked = newlyUnlocked(candidate)
  if (unlocked.length) updates.achievements = [...(pet.achievements ?? []), ...unlocked]

  const { data: updatedPet } = await supabase
    .from('pets')
    .update(updates)
    .eq('id', pet.id)
    .select()
    .single()

  const finalPet = (updatedPet ?? pet) as Pet

  const offline = awayMs > OFFLINE_THRESHOLD_MS
    ? { awayMs, delta }
    : null

  return NextResponse.json({
    pet: finalPet,
    mood: getMood(finalPet),
    evolved: false,
    offline,
    event,
    unlocked,
  })
}

// POST /api/pet — create a new pet
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  // check they don't already have a living pet
  const { data: existing } = await supabase
    .from('pets')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_alive', true)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'you already have a pet!' }, { status: 400 })
  }

  const { name } = await request.json()
  if (!name || name.trim().length === 0 || name.length > 20) {
    return NextResponse.json({ error: 'name must be 1–20 characters' }, { status: 400 })
  }

  const { data: pet, error } = await supabase
    .from('pets')
    .insert({
      user_id: user.id,
      name: name.trim(),
      stage: 'egg',
      hunger: 80,
      happy: 80,
      clean: 100,
      energy: 80,
      xp: 0,
      inventory: STARTER_INVENTORY,
    })
    .select()
    .single()

  if (error || !pet) {
    return NextResponse.json({ error: 'failed to create pet' }, { status: 500 })
  }

  return NextResponse.json({
    pet,
    mood: getMood(pet as Pet),
    evolved: false,
  })
}
