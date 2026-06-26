import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMood } from '@/lib/pet'
import { grantGameReward, isGameId } from '@/lib/shop'
import { newlyUnlocked } from '@/lib/progress'
import type { Pet } from '@/types/pet'

// POST /api/game/reward  — body: { game, score }
//   game:  'memory' | 'simon' | 'reaction'
//   score: 0..1 performance (server caps the payout)
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  const { game, score } = await request.json()
  if (!isGameId(game)) {
    return NextResponse.json({ error: 'invalid game' }, { status: 400 })
  }

  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_alive', true)
    .single()

  if (petError || !pet) {
    return NextResponse.json({ error: 'no pet found' }, { status: 404 })
  }

  const { updates, coins, xp, evolved } = grantGameReward(pet as Pet, game, Number(score))

  const candidate = { ...(pet as Pet), ...updates } as Pet
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
    pet_id: pet.id, action: 'game', delta: { game, coins, xp },
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
    earned: { coins, xp },
    unlocked,
  })
}
