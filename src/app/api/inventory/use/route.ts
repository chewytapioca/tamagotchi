import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMood, clamp, checkEvolution, bumpCounter } from '@/lib/pet'
import { feedWithFood } from '@/lib/favorites'
import { newlyUnlocked } from '@/lib/progress'
import type { Pet } from '@/types/pet'

// POST /api/inventory/use — body: { foodId }  (eat a treat from the inventory)
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  const { foodId } = await request.json()
  if (typeof foodId !== 'string') {
    return NextResponse.json({ error: 'invalid food' }, { status: 400 })
  }

  const { data: petRow, error: petError } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_alive', true)
    .single()

  if (petError || !petRow) {
    return NextResponse.json({ error: 'no pet found' }, { status: 404 })
  }
  const pet = petRow as Pet

  if ((pet.inventory?.[foodId] ?? 0) <= 0) {
    return NextResponse.json({ error: "you don't have that treat" }, { status: 400 })
  }

  const out = feedWithFood(pet, foodId)
  if (!out) return NextResponse.json({ error: 'unknown food' }, { status: 400 })

  // consume one from the inventory
  const inv = { ...(pet.inventory ?? {}) }
  inv[foodId] = (inv[foodId] ?? 0) - 1
  if (inv[foodId] <= 0) delete inv[foodId]

  const newXp = (pet.xp ?? 0) + out.xp
  const updates: Partial<Pet> = {
    hunger: clamp(pet.hunger + out.hunger),
    happy: clamp(pet.happy + out.happy),
    affection: (pet.affection ?? 0) + out.affection,
    coins: (pet.coins ?? 0) + out.coins,
    xp: newXp,
    inventory: inv,
    counters: bumpCounter(bumpCounter(pet.counters, 'feed'), 'food_used'),
    last_visit: new Date().toISOString(),
  }

  const { evolved, newStage } = checkEvolution(pet.stage, newXp)
  if (evolved && newStage) updates.stage = newStage

  const candidate = { ...pet, ...updates } as Pet
  const unlocked = newlyUnlocked(candidate)
  if (unlocked.length) updates.achievements = [...(pet.achievements ?? []), ...unlocked]

  const { data: updatedPet, error: updateError } = await supabase
    .from('pets')
    .update(updates)
    .eq('id', pet.id)
    .select()
    .single()

  if (updateError || !updatedPet) {
    return NextResponse.json({ error: 'failed to update pet' }, { status: 500 })
  }

  await supabase.from('pet_events').insert({
    pet_id: pet.id, action: 'feed', delta: { food: foodId, reaction: out.reaction },
  })
  if (evolved) {
    await supabase.from('pet_events').insert({
      pet_id: pet.id, action: 'evolve', delta: { stage: updatedPet.stage },
    })
  }

  return NextResponse.json({
    pet: updatedPet,
    mood: getMood(updatedPet as Pet),
    evolved,
    unlocked,
    reaction: out.reaction,
    message: out.message,
  })
}
