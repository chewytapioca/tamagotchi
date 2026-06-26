'use client'

import { useState } from 'react'
import { getFood } from '@/lib/favorites'
import type { Pet, PetMood } from '@/types/pet'

interface UseResult {
  pet: Pet; mood: PetMood; evolved: boolean
  reaction?: string; message?: string; unlocked?: string[]
}

interface Props {
  pet: Pet
  ink: string
  onResult: (r: UseResult) => void
}

// horizontal strip of owned treats; tap one to feed it to the pet
export default function InventoryBar({ pet, ink, onResult }: Props) {
  const [busy, setBusy] = useState(false)
  const entries = Object.entries(pet.inventory ?? {}).filter(([, n]) => n > 0)
  if (entries.length === 0) return null

  async function use(foodId: string) {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/inventory/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId }),
      })
      const data = await res.json()
      if (res.ok) onResult(data)
    } catch { /* ignore */ }
    finally { setBusy(false) }
  }

  return (
    <div style={{
      display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap',
      background: '#ffffffcc', borderRadius: 8, padding: '5px 6px',
      border: `1.5px solid ${ink}22`,
    }}>
      {entries.map(([id, qty]) => {
        const food = getFood(id)
        if (!food) return null
        return (
          <button key={id} onClick={() => use(id)} disabled={busy}
            title={`feed ${food.name}`}
            style={{
              position: 'relative', width: 34, height: 34, borderRadius: 8,
              border: `1.5px solid ${ink}33`, background: '#fff',
              cursor: busy ? 'default' : 'pointer', fontSize: 19, lineHeight: 1,
              opacity: busy ? 0.6 : 1,
            }}>
            {food.emoji}
            <span style={{
              position: 'absolute', right: -4, bottom: -4,
              background: ink, color: '#fff', borderRadius: 99,
              fontSize: 10, fontWeight: 700, padding: '0 4px', minWidth: 14,
            }}>{qty}</span>
          </button>
        )
      })}
    </div>
  )
}
