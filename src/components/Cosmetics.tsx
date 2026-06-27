'use client'

import { forwardRef } from 'react'
import PetDisplay, { PetDisplayHandle } from '@/components/PetDisplay'
import { getItem } from '@/lib/shop'
import type { Pet, PetMood } from '@/types/pet'

// pet sprite is 28 cols * 7px = 196px square
const PET_PX = 196

// ── worn cosmetics positioned over the pixel pet ─────────────
// hat sits atop the head, outfit over the lower body, accessory by the face.
const HAT_STYLE: React.CSSProperties = {
  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
  fontSize: 46, lineHeight: 1, pointerEvents: 'none', zIndex: 3,
  filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.18))',
}
const OUTFIT_STYLE: React.CSSProperties = {
  position: 'absolute', top: 126, left: '50%', transform: 'translateX(-50%)',
  fontSize: 40, lineHeight: 1, pointerEvents: 'none', zIndex: 2,
  filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.18))',
}
// some accessories want a different anchor than "over the eyes"
const ACCESSORY_OVERRIDES: Record<string, React.CSSProperties> = {
  scarf:   { top: 118, fontSize: 34 },
  starpin: { top: 60, left: '68%', fontSize: 24 },
}
const ACCESSORY_BASE: React.CSSProperties = {
  position: 'absolute', top: 78, left: '50%', transform: 'translateX(-50%)',
  fontSize: 30, lineHeight: 1, pointerEvents: 'none', zIndex: 4,
  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.18))',
}

interface PetWithCosmeticsProps {
  pet: Pet
  mood: PetMood
  onPet?: () => void
  inkColor?: string
}

// wraps PetDisplay and layers any equipped hat / outfit / accessory on top
export const PetWithCosmetics = forwardRef<PetDisplayHandle, PetWithCosmeticsProps>(
  ({ pet, mood, onPet, inkColor }, ref) => {
    const eq = pet.equipped ?? {}
    const hat = eq.hat ? getItem(eq.hat) : undefined
    const outfit = eq.outfit ? getItem(eq.outfit) : undefined
    const accessory = eq.accessory ? getItem(eq.accessory) : undefined

    return (
      <div style={{ position: 'relative', width: PET_PX, height: PET_PX }}>
        <PetDisplay ref={ref} pet={pet} mood={mood} onPet={onPet} inkColor={inkColor} />
        {outfit && <span style={OUTFIT_STYLE} aria-hidden>{outfit.icon}</span>}
        {hat && <span style={HAT_STYLE} aria-hidden>{hat.icon}</span>}
        {accessory && (
          <span
            style={{ ...ACCESSORY_BASE, ...(ACCESSORY_OVERRIDES[accessory.id] ?? {}) }}
            aria-hidden
          >
            {accessory.icon}
          </span>
        )}
      </div>
    )
  },
)
PetWithCosmetics.displayName = 'PetWithCosmetics'

// ── full-screen scene background (behind the pet) ────────────
export function SceneBackground({ backgroundId }: { backgroundId?: string }) {
  const item = backgroundId ? getItem(backgroundId) : undefined
  if (!item?.bg) return null
  const { from, to, scene = [] } = item.bg
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(170deg, ${from} 0%, ${to} 100%)` }} />
      {/* sparse scattered scene emoji */}
      {scene.map((emoji, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: `${12 + ((i * 31) % 76)}%`,
          top: `${10 + ((i * 23) % 40)}%`,
          fontSize: 18 + (i % 3) * 6,
          opacity: 0.5,
        }}>{emoji}</span>
      ))}
    </div>
  )
}

// ── default cozy room (shown when no scene background is equipped) ──
export function DefaultRoom() {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {/* wall + floor */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #FFE9F2 0%, #FFE0EC 62%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%', background: 'linear-gradient(180deg, #F6CFE0, #EFC0D6)' }} />
      {/* round rug under the pet */}
      <div style={{
        position: 'absolute', left: '50%', bottom: '20%', transform: 'translateX(-50%)',
        width: '64%', height: '20%', borderRadius: '50%',
        background: 'radial-gradient(closest-side, #FBB8D2, #F3A6C6)', opacity: 0.85,
      }} />
      {/* arched window, top-left (small & cute) */}
      <div style={{
        position: 'absolute', left: '9%', top: '11%', width: 40, height: 46,
        background: 'linear-gradient(180deg, #CFEAFB 0%, #EAF7FF 100%)',
        border: '3px solid #fff', borderRadius: '20px 20px 6px 6px',
        boxShadow: '0 0 0 2px #F3A6C6, inset 0 0 0 2px #ffffffaa',
        overflow: 'hidden',
      }}>
        {/* sky glints */}
        <span style={{ position: 'absolute', left: 5, top: 8, fontSize: 9 }}>☁️</span>
        <span style={{ position: 'absolute', right: 4, bottom: 4, fontSize: 8 }}>✦</span>
      </div>
      {/* curtain pelmet over the window */}
      <div style={{
        position: 'absolute', left: '7%', top: '8%', width: 50, height: 10,
        background: '#F7B8D0', borderRadius: 6,
      }} />
      {/* framed heart picture, top-right */}
      <div style={{
        position: 'absolute', right: '9%', top: '12%', width: 28, height: 28,
        background: '#fff', border: '3px solid #F3A6C6', borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
      }}>💗</div>
      {/* bookshelf + plants */}
      <span style={{ position: 'absolute', right: '6%', bottom: '23%', fontSize: 28 }}>📚</span>
      <span style={{ position: 'absolute', left: '8%', bottom: '21%', fontSize: 22 }}>🪴</span>
      <span style={{ position: 'absolute', right: '22%', bottom: '22%', fontSize: 16 }}>🌱</span>
    </div>
  )
}

// ── room decorations along the bottom of the screen ──────────
export function RoomDecor({ decor }: { decor?: string[] }) {
  const items = (decor ?? []).map(getItem).filter(Boolean)
  if (items.length === 0) return null
  return (
    <div aria-hidden style={{
      position: 'absolute', left: 0, right: 0, bottom: 6, zIndex: 1,
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
      pointerEvents: 'none', padding: '0 10px',
    }}>
      {items.map((it, i) => (
        <span key={i} style={{
          fontSize: 26,
          filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.15))',
          transform: i % 2 ? 'translateY(-2px)' : 'none',
        }}>{it!.icon}</span>
      ))}
    </div>
  )
}
