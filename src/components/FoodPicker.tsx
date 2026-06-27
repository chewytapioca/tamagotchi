'use client'

import { useState } from 'react'
import { FOODS, isStaple, foodReaction } from '@/lib/favorites'
import type { Pet, PetMood } from '@/types/pet'

interface UseResult {
  pet: Pet; mood: PetMood; evolved: boolean
  reaction?: string; message?: string; unlocked?: string[]
}

interface Props {
  pet: Pet
  ink: string
  accent: string
  onClose: () => void
  onResult: (r: UseResult) => void
}

const REACTION_TAG: Record<string, string> = {
  loves: '♡ loves', likes: '♡ likes', hates: '✗ hates',
}

// choose which food to feed the pet
export default function FoodPicker({ pet, ink, accent, onClose, onResult }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const px = { fontFamily: '"VT323","Press Start 2P","Courier New",monospace', letterSpacing: '0.04em' }
  const titleF = { fontFamily: '"Press Start 2P","VT323",monospace' }

  async function feed(foodId: string) {
    setBusy(foodId); setErr(null)
    try {
      const res = await fetch('/api/inventory/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'could not feed'); return }
      onResult(data)
      onClose()
    } catch {
      setErr('network error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, ...px,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#FFF8F4', borderRadius: 20, width: '100%', maxWidth: 380,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        border: `3px solid ${ink}`, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `2px solid ${ink}22` }}>
          <span style={{ fontSize: 13, color: ink, ...titleF }}>🍴 FEED {pet.name}</span>
          <button onClick={onClose} aria-label="close" style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: ink, lineHeight: 1 }}>×</button>
        </div>

        {err && <div style={{ color: '#c44', fontSize: 13, textAlign: 'center', padding: '6px 12px' }}>{err}</div>}

        <div style={{ padding: 12, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {FOODS.map(food => {
            const stock = pet.inventory?.[food.id] ?? 0
            const staple = isStaple(food.id)
            const available = staple || stock > 0
            const reaction = foodReaction(pet.id, food.id)
            const tag = REACTION_TAG[reaction]
            const working = busy === food.id
            return (
              <button key={food.id}
                onClick={() => available && feed(food.id)}
                disabled={!available || working || busy !== null}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  padding: '10px', borderRadius: 12,
                  border: `2px solid ${available ? ink + '33' : ink + '14'}`,
                  background: available ? '#fff' : '#0000000a',
                  opacity: available ? 1 : 0.5, cursor: available ? 'pointer' : 'default',
                }}>
                <span style={{ fontSize: 30, lineHeight: 1 }}>{food.emoji}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 15, color: ink, fontWeight: 700 }}>{food.name}</span>
                  <span style={{ display: 'block', fontSize: 12, color: ink, opacity: 0.7 }}>
                    {staple ? 'staple · free' : stock > 0 ? `×${stock}` : 'buy in shop'}
                    {tag ? ` · ${tag}` : ''}
                  </span>
                </span>
                {working && <span style={{ fontSize: 12, color: accent }}>…</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
