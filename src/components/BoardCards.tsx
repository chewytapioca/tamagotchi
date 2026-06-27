'use client'

import { useEffect, useState } from 'react'
import { petFavorites, getFood } from '@/lib/favorites'
import { ACHIEVEMENTS, bondLevel, bondTier, BOND_MAX } from '@/lib/progress'
import { getWeather, getSpecialDay, type WeatherInfo } from '@/lib/world'
import InventoryBar from '@/components/InventoryBar'
import type { Pet, PetMood } from '@/types/pet'

const px = { fontFamily: '"VT323","Press Start 2P","Courier New",monospace', letterSpacing: '0.04em' } as const
const titleF = { fontFamily: '"Press Start 2P","VT323",monospace' } as const

interface UseResult { pet: Pet; mood: PetMood; evolved: boolean; message?: string; unlocked?: string[] }

export interface BoardProps {
  pet: Pet
  ink: string
  accent: string
  now: Date
  offline: { awayMs: number; delta: Record<string, number> } | null
  onShop: () => void
  onGames: () => void
  onInfo: () => void
  onFeedResult: (r: UseResult) => void
}

// ── shared "in-game window" card shell ──────────────────────
// chrome colours come from CSS vars (--win-*) set on the page root.
function Card({ title, children, onClick }: {
  title: string; children: React.ReactNode; onClick?: () => void
}) {
  return (
    <div className="tama-window" onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="tama-window-title">{title}</div>
      <div className="tama-window-body">{children}</div>
    </div>
  )
}

const colStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex', flexDirection: 'column', gap: 18,
}

// ── MOOD & EXPRESSIONS ──
const MOODS: { emoji: string; label: string }[] = [
  { emoji: '😊', label: 'Happy' }, { emoji: '🤩', label: 'Excited' }, { emoji: '😢', label: 'Sad' },
  { emoji: '😠', label: 'Angry' }, { emoji: '😴', label: 'Sleepy' }, { emoji: '🤒', label: 'Sick' },
]
function MoodCard({ ink, accent }: BoardProps) {
  return (
    <Card title="MOOD & EXPRESSIONS">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, ...px }}>
        {MOODS.map(m => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 24, background: `${accent}14`, borderRadius: 10,
              border: `1.5px solid ${accent}55`, padding: '4px 0',
            }}>{m.emoji}</div>
            <div style={{ fontSize: 12, color: ink, marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── FAVORITES ──
function FavoritesCard({ pet, ink, accent }: BoardProps) {
  const fav = petFavorites(pet.id)
  const rows: [string, ReturnType<typeof getFood>][] = [
    ['Loves', getFood(fav.loves)], ['Likes', getFood(fav.likes)], ['Hates', getFood(fav.hates)],
  ]
  return (
    <Card title="FAVORITES">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center', ...px }}>
        {rows.map(([label, food]) => (
          <div key={label}>
            <div style={{ fontSize: 12, color: accent, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 30, lineHeight: 1.2 }}>{food?.emoji ?? '❓'}</div>
            <div style={{ fontSize: 12, color: ink, opacity: 0.7 }}>{food?.name}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── ROOM & CUSTOMIZATION ──
function RoomCard({ pet, ink, accent, onShop }: BoardProps) {
  const eq = pet.equipped ?? {}
  const worn = [eq.hat, eq.outfit, eq.accessory].filter(Boolean).length + (eq.decor?.length ?? 0)
  return (
    <Card title="ROOM & CUSTOMIZATION" onClick={onShop}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', ...px }}>
        <div style={{
          flex: 1, height: 54, borderRadius: 10, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(180deg,#FFE9F2,#F6CFE0)', border: `1.5px solid ${accent}55`,
        }}>
          <span style={{ position: 'absolute', left: 6, top: 4, fontSize: 16 }}>🪟</span>
          <span style={{ position: 'absolute', right: 6, bottom: 2, fontSize: 18 }}>📚</span>
          <span style={{ position: 'absolute', left: '42%', bottom: 2, fontSize: 20 }}>🐰</span>
          <span style={{ position: 'absolute', left: 8, bottom: 2, fontSize: 14 }}>🪴</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: ink, fontWeight: 700 }}>{worn} worn</div>
          <div style={{
            marginTop: 4, fontSize: 10, color: '#fff', background: accent,
            borderRadius: 99, padding: '4px 10px', ...titleF,
          }}>CUSTOMIZE</div>
        </div>
      </div>
    </Card>
  )
}

// ── MINI GAMES (ARCADE) ──
const GAME_TILES = [
  { emoji: '🃏', label: 'MEMORY' }, { emoji: '🧺', label: 'CATCH!' },
  { emoji: '🎵', label: 'SIMON' }, { emoji: '⭐', label: 'REACTION' },
]
function GamesCard({ ink, accent, onGames }: BoardProps) {
  return (
    <Card title="MINI GAMES (ARCADE)" onClick={onGames}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, ...px }}>
        {GAME_TILES.map(g => (
          <div key={g.label} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: `${accent}12`, border: `1.5px solid ${accent}44`, borderRadius: 10, padding: '6px 8px',
          }}>
            <span style={{ fontSize: 20 }}>{g.emoji}</span>
            <span style={{ fontSize: 11, color: ink, ...titleF }}>{g.label}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: ink, opacity: 0.75, marginTop: 8, ...px }}>
        Earn coins and XP! 🪙 ⭐
      </div>
    </Card>
  )
}

// ── JOURNAL ──
interface JournalEntry { id: string; day: number; emoji: string; text: string }
function JournalCard({ ink, accent }: BoardProps) {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null)
  useEffect(() => {
    fetch('/api/journal').then(r => r.json()).then(d => setEntries(d.entries ?? [])).catch(() => setEntries([]))
  }, [])
  return (
    <Card title="JOURNAL">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...px }}>
        {entries === null
          ? <div style={{ color: ink, opacity: 0.6, textAlign: 'center', fontSize: 13 }}>loading…</div>
          : entries.slice(0, 5).map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ fontSize: 15 }}>{e.emoji}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 10, color: accent, ...titleF }}>DAY {e.day}</span>
                <span style={{ display: 'block', fontSize: 13, color: ink }}>{e.text}</span>
              </span>
            </div>
          ))}
      </div>
    </Card>
  )
}

// ── ACHIEVEMENTS ──
function AchievementsCard({ pet, ink, accent }: BoardProps) {
  const have = new Set(pet.achievements ?? [])
  return (
    <Card title="ACHIEVEMENTS">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...px }}>
        {ACHIEVEMENTS.slice(0, 6).map(a => {
          const done = have.has(a.id)
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: done ? 1 : 0.55 }}>
              <span style={{ fontSize: 18, filter: done ? 'none' : 'grayscale(1)' }}>{a.emoji}</span>
              <span style={{ flex: 1, fontSize: 13, color: ink }}>{a.name}</span>
              <span style={{ fontSize: 13 }}>{done ? '✅' : '🔒'}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── WEATHER ──
const WEATHER_TILES: { kind: WeatherInfo['kind']; emoji: string; label: string }[] = [
  { kind: 'sunny', emoji: '☀️', label: 'Sunny' }, { kind: 'rainy', emoji: '🌧️', label: 'Rainy' },
  { kind: 'snowy', emoji: '❄️', label: 'Snowy' }, { kind: 'blossom', emoji: '🌸', label: 'Blossom' },
]
function WeatherCard({ ink, accent, now }: BoardProps) {
  const today = getWeather(now).kind
  return (
    <Card title="WEATHER">
      <div style={{ display: 'flex', gap: 6, justifyContent: 'space-around', ...px }}>
        {WEATHER_TILES.map(w => {
          const active = w.kind === today
          return (
            <div key={w.kind} style={{ textAlign: 'center', opacity: active ? 1 : 0.5 }}>
              <div style={{
                fontSize: 22, padding: '5px 8px', borderRadius: 10,
                background: active ? `${accent}22` : 'transparent',
                border: active ? `2px solid ${accent}` : '2px solid transparent',
              }}>{w.emoji}</div>
              <div style={{ fontSize: 11, color: ink, marginTop: 2 }}>{w.label}</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── INVENTORY ──
function InventoryCard({ pet, ink, accent, onFeedResult }: BoardProps) {
  const count = Object.values(pet.inventory ?? {}).reduce((a, b) => a + b, 0)
  return (
    <Card title="INVENTORY">
      {count > 0
        ? <InventoryBar pet={pet} ink={ink} onResult={onFeedResult} />
        : <div style={{ textAlign: 'center', color: ink, opacity: 0.6, fontSize: 13, ...px }}>no treats — buy some in the shop! ♡</div>}
    </Card>
  )
}

// ── AFFECTION (BOND) ──
function BondCard({ pet, ink, accent }: BoardProps) {
  const level = bondLevel(pet.affection ?? 0)
  return (
    <Card title="AFFECTION (BOND)">
      <div style={{ textAlign: 'center', ...px }}>
        <div style={{ fontSize: 16 }}>{Array.from({ length: BOND_MAX }).map((_, i) => i < level ? '💗' : '🤍').join('')}</div>
        <div style={{ fontSize: 14, color: ink, fontWeight: 700, marginTop: 4 }}>{bondTier(level)} · {level}/{BOND_MAX}</div>
      </div>
    </Card>
  )
}

// ── SPECIAL DAYS ──
const SPECIAL_TILES = [
  { id: 'birthday', emoji: '🎂', label: 'Birthday' }, { id: 'halloween', emoji: '🎃', label: 'Halloween' },
  { id: 'xmas', emoji: '🎄', label: 'Xmas' }, { id: 'newyear', emoji: '🎉', label: 'New Year' },
]
function SpecialDaysCard({ pet, ink, accent, now }: BoardProps) {
  const active = getSpecialDay(pet.born_at, now)?.id
  return (
    <Card title="SPECIAL DAYS">
      <div style={{ display: 'flex', gap: 6, justifyContent: 'space-around', ...px }}>
        {SPECIAL_TILES.map(s => (
          <div key={s.id} style={{ textAlign: 'center', opacity: active === s.id ? 1 : 0.6 }}>
            <div style={{
              fontSize: 22, padding: '5px 6px', borderRadius: 10,
              background: active === s.id ? `${accent}22` : 'transparent',
              border: active === s.id ? `2px solid ${accent}` : '2px solid transparent',
            }}>{s.emoji}</div>
            <div style={{ fontSize: 11, color: ink, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── OFFLINE PROGRESS ──
function OfflineCard({ ink, accent, offline }: BoardProps) {
  const STAT = [['hunger', '♥'], ['happy', '✿'], ['clean', '✧'], ['energy', '⚡']] as const
  return (
    <Card title="OFFLINE PROGRESS">
      {offline
        ? <div style={{ textAlign: 'center', ...px }}>
            <div style={{ fontSize: 13, color: ink, marginBottom: 6 }}>away for {formatAway(offline.awayMs)}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, fontSize: 13, color: ink }}>
              {STAT.map(([k, icon]) => <span key={k}>{icon} {offline.delta[k] ?? 0}</span>)}
            </div>
          </div>
        : <div style={{ textAlign: 'center', color: ink, opacity: 0.65, fontSize: 13, ...px }}>all caught up! 😴💤</div>}
    </Card>
  )
}

function formatAway(ms: number): string {
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

// ── exported regions ────────────────────────────────────────
export function BoardTitle({ accent }: { accent: string }) {
  return (
    <h1 style={{
      ...titleF, color: accent, fontSize: 16, textAlign: 'center',
      margin: '0 0 16px', letterSpacing: '0.06em',
    }}>♡ TAMAGOTCHI ♡</h1>
  )
}

export function LeftColumn(p: BoardProps) {
  return (
    <div style={colStyle}>
      <MoodCard {...p} />
      <FavoritesCard {...p} />
      <RoomCard {...p} />
    </div>
  )
}

export function RightColumn(p: BoardProps) {
  return (
    <div style={colStyle}>
      <GamesCard {...p} />
      <JournalCard {...p} />
      <AchievementsCard {...p} />
    </div>
  )
}

export function BottomRow(p: BoardProps) {
  return (
    <div className="tama-bottom">
      <WeatherCard {...p} />
      <InventoryCard {...p} />
      <BondCard {...p} />
      <SpecialDaysCard {...p} />
      <OfflineCard {...p} />
    </div>
  )
}
