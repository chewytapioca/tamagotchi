import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getItem } from '@/lib/shop'

interface JournalEntry { id: string; day: number; ts: string; emoji: string; text: string }

function dayNumber(ts: string, bornAt: string): number {
  const ms = new Date(ts).getTime() - new Date(bornAt).getTime()
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1)
}

// GET /api/journal — a friendly timeline built from pet_events
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id, name, born_at')
    .eq('user_id', user.id)
    .eq('is_alive', true)
    .single()

  if (!pet) return NextResponse.json({ entries: [] })

  const { data: events } = await supabase
    .from('pet_events')
    .select('id, action, delta, ts')
    .eq('pet_id', pet.id)
    .order('ts', { ascending: false })
    .limit(40)

  const entries: JournalEntry[] = []

  for (const e of events ?? []) {
    const day = dayNumber(e.ts, pet.born_at)
    const delta = (e.delta ?? {}) as Record<string, unknown>
    let emoji = '✿'
    let text = ''
    switch (e.action) {
      case 'evolve': emoji = '🌟'; text = `Reached ${String(delta.stage ?? 'a new')} stage!`; break
      case 'game':   emoji = '🎮'; text = `Played an arcade game (+${Number(delta.coins ?? 0)} coins).`; break
      case 'shop': {
        const item = typeof delta.bought === 'string' ? getItem(delta.bought) : undefined
        emoji = '🛍'; text = item ? `Got the ${item.name}.` : 'Visited the shop.'; break
      }
      case 'treat': emoji = '🍰'; text = 'Enjoyed a treat.'; break
      case 'hug':   emoji = '💗'; text = 'Shared a warm hug.'; break
      case 'feed':  emoji = '🍙'; text = 'Had a tasty meal.'; break
      case 'play':  emoji = '🎀'; text = 'Played together.'; break
      case 'clean': emoji = '🫧'; text = 'Got squeaky clean.'; break
      case 'sleep': emoji = '🌙'; text = 'Took a cozy nap.'; break
      default: continue   // skip noise like decay
    }
    entries.push({ id: e.id, day, ts: e.ts, emoji, text })
  }

  // always anchor the very first day with the hatch milestone
  entries.push({ id: 'hatch', day: 1, ts: pet.born_at, emoji: '🥚', text: `${pet.name} hatched!` })

  return NextResponse.json({ entries })
}
