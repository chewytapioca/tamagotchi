'use client'

import { useState } from 'react'
import {
  SHOP_ITEMS, ITEM_TYPES, type ItemType, type ShopItem,
  petLevel, isOwned,
} from '@/lib/shop'
import type { Pet, PetMood } from '@/types/pet'

interface PetState { pet: Pet; mood: PetMood; evolved: boolean }

interface Props {
  pet: Pet
  ink: string
  accent: string
  onClose: () => void
  onUpdate: (state: PetState) => void
}

function isEquipped(pet: Pet, item: ShopItem): boolean {
  const eq = pet.equipped ?? {}
  if (item.type === 'food') return false           // consumables aren't equipped
  if (item.type === 'decor') return (eq.decor ?? []).includes(item.id)
  return eq[item.type] === item.id
}

export default function Shop({ pet, ink, accent, onClose, onUpdate }: Props) {
  const [tab, setTab] = useState<'shop' | 'closet'>('shop')
  const [type, setType] = useState<ItemType>('hat')
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const px = { fontFamily: '"VT323","Press Start 2P","Courier New",monospace', letterSpacing: '0.04em' }
  const title = { fontFamily: '"Press Start 2P","VT323",monospace' }

  const level = petLevel(pet)

  async function call(url: string, itemId: string) {
    setBusy(itemId); setErr(null)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'something went wrong'); return }
      onUpdate(data)
    } catch {
      setErr('network error')
    } finally {
      setBusy(null)
    }
  }

  const shown = tab === 'shop'
    ? SHOP_ITEMS.filter(i => i.type === type)
    : SHOP_ITEMS.filter(i => isOwned(pet, i.id))

  const Tile = ({ item }: { item: ShopItem }) => {
    const owned = isOwned(pet, item.id)
    const equipped = isEquipped(pet, item)
    const locked = level < (item.minLevel ?? 1)
    const affordable = pet.coins >= item.price
    const working = busy === item.id

    let btnLabel: string
    let btnBg = accent
    let onClick: (() => void) | undefined
    let disabled = working

    if (tab === 'closet' || owned) {
      btnLabel = equipped ? 'Wearing ✓' : 'Wear'
      btnBg = equipped ? '#7BB87B' : accent
      onClick = () => call('/api/shop/equip', item.id)
    } else if (locked) {
      btnLabel = `Lv.${item.minLevel}`; btnBg = '#bbb'; disabled = true
    } else if (!affordable) {
      btnLabel = `🪙 ${item.price}`; btnBg = '#cdb'; disabled = true; onClick = undefined
    } else {
      btnLabel = `🪙 ${item.price}`
      onClick = () => call('/api/shop/buy', item.id)
    }

    return (
      <div style={{
        background: '#fff',
        border: `2px solid ${equipped ? '#7BB87B' : ink + '22'}`,
        borderRadius: 12, padding: '10px 8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 34, lineHeight: 1 }}>{item.icon}</div>
        <div style={{ fontSize: 14, color: ink, fontWeight: 700, ...px }}>{item.name}</div>
        <div style={{ fontSize: 12, color: ink, opacity: 0.55, minHeight: 16, ...px }}>{item.blurb}</div>
        <button
          onClick={onClick}
          disabled={disabled}
          style={{
            marginTop: 2, padding: '5px 10px', borderRadius: 99,
            border: 'none', background: btnBg, color: '#fff',
            fontSize: 11, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
            opacity: working ? 0.6 : 1, minWidth: 70, ...title,
          }}
        >{working ? '…' : btnLabel}</button>
      </div>
    )
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, ...px,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFF8F4', borderRadius: 20, width: '100%', maxWidth: 420,
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          border: `3px solid ${ink}`, boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderBottom: `2px solid ${ink}22`,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['shop', 'closet'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setErr(null) }}
                style={{
                  padding: '6px 14px', borderRadius: 99, border: `2px solid ${ink}`,
                  background: tab === t ? ink : 'transparent',
                  color: tab === t ? '#fff' : ink,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', ...title,
                }}>{t === 'shop' ? '🛍 SHOP' : '👗 CLOSET'}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, color: ink, fontWeight: 700 }}>🪙 {pet.coins}</span>
            <button onClick={onClose} aria-label="close" style={{
              border: 'none', background: 'transparent', fontSize: 22,
              cursor: 'pointer', color: ink, lineHeight: 1,
            }}>×</button>
          </div>
        </div>

        {/* category tabs (shop only) */}
        {tab === 'shop' && (
          <div style={{ display: 'flex', gap: 4, padding: '10px 12px 4px', flexWrap: 'wrap' }}>
            {ITEM_TYPES.map(t => (
              <button key={t.type} onClick={() => setType(t.type)}
                style={{
                  padding: '4px 10px', borderRadius: 99,
                  border: `1.5px solid ${ink}33`,
                  background: type === t.type ? accent : '#fff',
                  color: type === t.type ? '#fff' : ink,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', ...px,
                }}>{t.emoji} {t.label}</button>
            ))}
          </div>
        )}

        {err && (
          <div style={{ color: '#c44', fontSize: 13, textAlign: 'center', padding: '4px 12px' }}>{err}</div>
        )}

        {/* item grid */}
        <div style={{
          padding: 12, overflowY: 'auto',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        }}>
          {shown.length === 0
            ? <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: ink, opacity: 0.6, padding: 24, fontSize: 15 }}>
                nothing here yet — earn coins in games & visit the shop! ♡
              </div>
            : shown.map(item => <Tile key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  )
}
