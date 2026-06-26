import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMood } from '@/lib/pet'
import { toggleEquip } from '@/lib/shop'
import type { Pet } from '@/types/pet'

// POST /api/shop/equip  — body: { itemId }  (toggles equip/unequip)
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  const { itemId } = await request.json()
  if (typeof itemId !== 'string') {
    return NextResponse.json({ error: 'invalid item' }, { status: 400 })
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

  const result = toggleEquip(pet as Pet, itemId)
  if (!result.ok || !result.updates) {
    return NextResponse.json({ error: result.error ?? 'cannot equip' }, { status: 400 })
  }

  const { data: updatedPet, error: updateError } = await supabase
    .from('pets')
    .update(result.updates)
    .eq('id', pet.id)
    .select()
    .single()

  if (updateError || !updatedPet) {
    return NextResponse.json({ error: 'failed to update pet' }, { status: 500 })
  }

  return NextResponse.json({
    pet: updatedPet,
    mood: getMood(updatedPet as Pet),
    evolved: false,
  })
}
