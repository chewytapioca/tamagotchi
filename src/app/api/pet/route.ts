import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMood } from '@/lib/pet'
import type { Pet } from '@/types/pet'

// GET /api/pet — get the current user's pet
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

  // update last_visit timestamp
  await supabase
    .from('pets')
    .update({ last_visit: new Date().toISOString() })
    .eq('id', pet.id)

  return NextResponse.json({
    pet,
    mood: getMood(pet as Pet),
    evolved: false,
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
