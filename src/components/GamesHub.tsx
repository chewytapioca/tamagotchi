'use client'

import { useState } from 'react'
import type { Pet, PetMood, GameId } from '@/types/pet'
import MemoryGame from '@/components/games/MemoryGame'
import SimonGame from '@/components/games/SimonGame'
import ReactionGame from '@/components/games/ReactionGame'
import CatchGame from '@/components/games/CatchGame'

interface PetState { pet: Pet; mood: PetMood; evolved: boolean }

interface Props {
  pet: Pet
  ink: string
  accent: string
  onClose: () => void
  onUpdate: (state: PetState) => void
}

const GAMES: { id: GameId; name: string; emoji: string; blurb: string }[] = [
  { id: 'memory',   name: 'Memory Match', emoji: '🃏', blurb: 'find the pairs' },
  { id: 'catch',    name: 'Catch!',       emoji: '🧺', blurb: 'catch the treats' },
  { id: 'simon',    name: 'Simon Says',   emoji: '🎵', blurb: 'repeat the pattern' },
  { id: 'reaction', name: 'Quick Tap',    emoji: '⭐', blurb: 'tap the star fast' },
]

export default function GamesHub({ pet, ink, accent, onClose, onUpdate }: Props) {
  const [screen, setScreen] = useState<'menu' | GameId>('menu')
  const [earned, setEarned] = useState<{ coins: number; xp: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const px = { fontFamily: '"VT323","Press Start 2P","Courier New",monospace', letterSpacing: '0.04em' }
  const title = { fontFamily: '"Press Start 2P","VT323",monospace' }

  async function reward(game: GameId, score: number) {
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/game/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, score }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'reward failed'); return }
      setEarned(data.earned)
      onUpdate(data)
    } catch {
      setErr('network error')
    } finally {
      setBusy(false)
    }
  }

  function handleComplete(game: GameId, score: number) {
    reward(game, score)
  }

  const activeGame = GAMES.find(g => g.id === screen)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, ...px,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFF8F4', borderRadius: 20, width: '100%', maxWidth: 420,
          maxHeight: '88vh', overflowY: 'auto',
          border: `3px solid ${ink}`, boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
        }}
      >
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderBottom: `2px solid ${ink}22`,
        }}>
          <span style={{ fontSize: 13, color: ink, fontWeight: 700, ...title }}>
            {screen === 'menu' ? '🎮 ARCADE' : activeGame?.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, color: ink, fontWeight: 700 }}>🪙 {pet.coins}</span>
            <button onClick={onClose} aria-label="close" style={{
              border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: ink, lineHeight: 1,
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {screen === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 14, color: ink, opacity: 0.7, textAlign: 'center', margin: '0 0 4px' }}>
                play to earn 🪙 coins & ⭐ XP!
              </p>
              {GAMES.map(g => (
                <button key={g.id}
                  onClick={() => { setEarned(null); setErr(null); setScreen(g.id) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 14,
                    border: `2px solid ${ink}22`, background: '#fff',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 32 }}>{g.emoji}</span>
                  <span>
                    <span style={{ display: 'block', fontSize: 16, color: ink, fontWeight: 700, ...px }}>{g.name}</span>
                    <span style={{ display: 'block', fontSize: 13, color: ink, opacity: 0.6, ...px }}>{g.blurb}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {screen !== 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              {earned ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: 44 }}>🎉</div>
                  <div style={{ fontSize: 18, color: ink, fontWeight: 700, ...title, margin: '8px 0' }}>
                    +🪙 {earned.coins}　+⭐ {earned.xp}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
                    <button onClick={() => { setEarned(null); setErr(null) }}
                      style={btn(ink, accent)}>play again</button>
                    <button onClick={() => setScreen('menu')} style={btn(ink, 'transparent', ink)}>back</button>
                  </div>
                </div>
              ) : (
                <>
                  {busy && <div style={{ fontSize: 13, color: ink }}>saving reward…</div>}
                  {screen === 'memory'   && <MemoryGame   key="m" onComplete={s => handleComplete('memory', s)}   ink={ink} accent={accent} />}
                  {screen === 'catch'    && <CatchGame    key="c" onComplete={s => handleComplete('catch', s)}    ink={ink} accent={accent} />}
                  {screen === 'simon'    && <SimonGame    key="s" onComplete={s => handleComplete('simon', s)}    ink={ink} />}
                  {screen === 'reaction' && <ReactionGame key="r" onComplete={s => handleComplete('reaction', s)} ink={ink} accent={accent} />}
                  <button onClick={() => setScreen('menu')} style={{
                    ...btn(ink, 'transparent', ink), marginTop: 4,
                  }}>← quit</button>
                </>
              )}
              {err && <div style={{ color: '#c44', fontSize: 13 }}>{err}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function btn(ink: string, bg: string, fg = '#fff'): React.CSSProperties {
  return {
    padding: '7px 16px', borderRadius: 99, border: `2px solid ${ink}`,
    background: bg, color: fg, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    fontFamily: '"Press Start 2P","VT323",monospace',
  }
}
