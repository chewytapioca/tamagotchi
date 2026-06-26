import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyAction, getMood } from '@/lib/pet'
import type { Pet, PetAction } from '@/types/pet'

const VALID_ACTIONS: PetAction[] = ['feed', 'play', 'clean', 'sleep', 'treat', 'hug']

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  const { action } = await request.json()
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
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

  const { updates, delta, evolved } = applyAction(pet as Pet, action)

  const { data: updatedPet, error: updateError } = await supabase
    .from('pets')
    .update(updates)
    .eq('id', pet.id)
    .select()
    .single()

  if (updateError || !updatedPet) {
    return NextResponse.json({ error: 'failed to update pet' }, { status: 500 })
  }

  await supabase.from('pet_events').insert({ pet_id: pet.id, action, delta })

  if (evolved) {
    await supabase.from('pet_events').insert({
      pet_id: pet.id,
      action: 'evolve',
      delta: { stage: updatedPet.stage },
    })
  }

  return NextResponse.json({
    pet: updatedPet,
    mood: getMood(updatedPet as Pet),
    evolved,
  })
}