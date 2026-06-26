'use client'

import { useEffect, useState } from 'react'
import { ACHIEVEMENTS, bondLevel, bondTier, BOND_MAX } from '@/lib/progress'
import { petFavorites, getFood } from '@/lib/favorites'
import type { Pet } from '@/types/pet'

interface JournalEntry { id: string; day: number; ts: string; emoji: string; text: string }

interface Props { pet: Pet; ink: string; accent: string; onClose: () => void }

export default function InfoPanel({ pet, ink, accent, onClose }: Props) {
  const [tab, setTab] = useState<'journal' | 'awards' | 'profile'>('profile')
  const [entries, setEntries] = useState<JournalEntry[] | null>(null)

  const px = { fontFamily: '"VT323","Press Start 2P","Courier New",monospace', letterSpacing: '0.04em' }
  const titleF = { fontFamily: '"Press Start 2P","VT323",monospace' }

  useEffect(() => {
    if (tab !== 'journal' || entries) return
    fetch('/api/journal').then(r => r.json()).then(d => setEntries(d.entries ?? [])).catch(() => setEntries([]))
  }, [tab, entries])

  const fav = petFavorites(pet.id)
  const loves = getFood(fav.loves), likes = getFood(fav.likes), hates = getFood(fav.hates)
  const level = bondLevel(pet.affection ?? 0)
  const have = new Set(pet.achievements ?? [])

  const TabBtn = ({ id, label }: { id: typeof tab; label: string }) => (
    <button onClick={() => setTab(id)} style={{
      padding: '6px 12px', borderRadius: 99, border: `2px solid ${ink}`,
      background: tab === id ? ink : 'transparent', color: tab === id ? '#fff' : ink,
      fontSize: 10, fontWeight: 700, cursor: 'pointer', ...titleF,
    }}>{label}</button>
  )

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, ...px,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#FFF8F4', borderRadius: 20, width: '100%', maxWidth: 420,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        border: `3px solid ${ink}`, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `2px solid ${ink}22` }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <TabBtn id="profile" label="📖 PROFILE" />
            <TabBtn id="awards" label="🏆 AWARDS" />
            <TabBtn id="journal" label="📔 JOURNAL" />
          </div>
          <button onClick={onClose} aria-label="close" style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: ink, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 14, overflowY: 'auto' }}>
          {/* ── profile: bond, favorites, stats ── */}
          {tab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <section>
                <h3 style={{ ...titleF, fontSize: 11, color: ink, margin: '0 0 8px' }}>AFFECTION</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ letterSpacing: 1, fontSize: 16 }}>
                    {Array.from({ length: BOND_MAX }).map((_, i) => i < level ? '💗' : '🤍').join('')}
                  </span>
                </div>
                <div style={{ fontSize: 15, color: ink, marginTop: 4 }}>{bondTier(level)} · {level}/{BOND_MAX}</div>
              </section>

              <section>
                <h3 style={{ ...titleF, fontSize: 11, color: ink, margin: '0 0 8px' }}>FAVORITES</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center' }}>
                  {[['Loves', loves], ['Likes', likes], ['Hates', hates]].map(([label, food]) => (
                    <div key={label as string} style={{ background: '#fff', border: `2px solid ${ink}22`, borderRadius: 12, padding: '8px 4px' }}>
                      <div style={{ fontSize: 30 }}>{(food as ReturnType<typeof getFood>)?.emoji ?? '❓'}</div>
                      <div style={{ fontSize: 13, color: ink, fontWeight: 700 }}>{label as string}</div>
                      <div style={{ fontSize: 12, color: ink, opacity: 0.6 }}>{(food as ReturnType<typeof getFood>)?.name}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 style={{ ...titleF, fontSize: 11, color: ink, margin: '0 0 8px' }}>STATS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, fontSize: 15, color: ink }}>
                  <span>🍙 Fed: {pet.counters?.feed ?? 0}×</span>
                  <span>🎮 Games: {pet.counters?.games ?? 0}</span>
                  <span>🍰 Treats: {pet.counters?.food_used ?? 0}</span>
                  <span>🎁 Items: {pet.owned_items?.length ?? 0}</span>
                </div>
              </section>
            </div>
          )}

          {/* ── achievements ── */}
          {tab === 'awards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACHIEVEMENTS.map(a => {
                const done = have.has(a.id)
                return (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12,
                    background: done ? '#fff' : '#0000000a',
                    border: `2px solid ${done ? accent : ink + '22'}`, opacity: done ? 1 : 0.6,
                  }}>
                    <span style={{ fontSize: 26, filter: done ? 'none' : 'grayscale(1)' }}>{a.emoji}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 15, color: ink, fontWeight: 700 }}>{a.name}</span>
                      <span style={{ display: 'block', fontSize: 13, color: ink, opacity: 0.6 }}>{a.desc}</span>
                    </span>
                    <span style={{ fontSize: 18 }}>{done ? '✅' : '🔒'}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── journal ── */}
          {tab === 'journal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entries === null
                ? <div style={{ textAlign: 'center', color: ink, opacity: 0.6, padding: 20 }}>loading…</div>
                : entries.length === 0
                  ? <div style={{ textAlign: 'center', color: ink, opacity: 0.6, padding: 20 }}>no entries yet ♡</div>
                  : entries.map(e => (
                    <div key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '6px 8px', borderLeft: `3px solid ${accent}`, background: '#fff', borderRadius: '0 8px 8px 0' }}>
                      <span style={{ fontSize: 18 }}>{e.emoji}</span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 14, color: ink }}>{e.text}</span>
                        <span style={{ display: 'block', fontSize: 11, color: ink, opacity: 0.5, ...titleF }}>DAY {e.day}</span>
                      </span>
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
