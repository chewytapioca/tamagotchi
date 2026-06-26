import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { applyDecay } from '@/lib/pet'
import type { Pet } from '@/types/pet'

// GET /api/cron
// called by vercel cron every hour
// protected by a shared secret in the Authorization header
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // fetch all living pets that haven't had decay run in the last 50 minutes
  // (small buffer to avoid double-decaying if cron fires slightly early)
  const cutoff = new Date(Date.now() - 50 * 60 * 1000).toISOString()

  const { data: pets, error } = await supabase
    .from('pets')
    .select('*')
    .eq('is_alive', true)
    .lt('last_decay', cutoff)

  if (error) {
    console.error('[cron] fetch error:', error)
    return NextResponse.json({ error: 'db error' }, { status: 500 })
  }

  if (!pets || pets.length === 0) {
    return NextResponse.json({ decayed: 0 })
  }

  let decayed = 0
  const errors: string[] = []

  for (const pet of pets) {
    try {
      const { updates, delta } = applyDecay(pet as Pet)

      const { error: updateError } = await supabase
        .from('pets')
        .update(updates)
        .eq('id', pet.id)

      if (updateError) throw updateError

      // log the decay event
      await supabase.from('pet_events').insert({
        pet_id: pet.id,
        action: 'decay',
        delta,
      })

      decayed++
    } catch (e) {
      errors.push(pet.id)
      console.error(`[cron] failed to decay pet ${pet.id}:`, e)
    }
  }

  return NextResponse.json({
    decayed,
    total: pets.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
