'use client'

import { useEffect, useRef, useState } from 'react'

// Memory match: flip cards to find all the pairs. Fewer mistakes = better score.
const FACES = ['🍓', '🌸', '⭐', '🍰', '🐰', '🎀']  // 6 pairs

interface Card { key: number; face: string; flipped: boolean; matched: boolean }

function build(): Card[] {
  const deck = [...FACES, ...FACES]
    .map((face, i) => ({ face, sort: Math.random(), key: i }))
    .sort((a, b) => a.sort - b.sort)
    .map((c, i) => ({ key: i, face: c.face, flipped: false, matched: false }))
  return deck
}

export default function MemoryGame({ onComplete, ink, accent }: {
  onComplete: (score: number) => void
  ink: string
  accent: string
}) {
  const [cards, setCards] = useState<Card[]>(build)
  const [first, setFirst] = useState<number | null>(null)
  const [lock, setLock] = useState(false)
  const [misses, setMisses] = useState(0)
  const doneRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function flip(idx: number) {
    if (lock || doneRef.current) return
    const card = cards[idx]
    if (card.flipped || card.matched) return

    const next = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c))
    setCards(next)

    if (first === null) { setFirst(idx); return }

    // second pick
    if (next[first].face === next[idx].face) {
      // match!
      const matched = next.map((c, i) =>
        i === first || i === idx ? { ...c, matched: true } : c)
      setCards(matched)
      setFirst(null)
      if (matched.every(c => c.matched)) {
        doneRef.current = true
        const score = Math.max(0, Math.min(1, 1 - misses / 8))
        timerRef.current = setTimeout(() => onComplete(score), 500)
      }
    } else {
      // mismatch — flip both back after a beat
      setLock(true)
      setMisses(m => m + 1)
      timerRef.current = setTimeout(() => {
        setCards(cur => cur.map((c, i) =>
          i === first || i === idx ? { ...c, flipped: false } : c))
        setFirst(null)
        setLock(false)
      }, 720)
    }
  }

  const matchedCount = cards.filter(c => c.matched).length / 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 13, color: ink }}>
        find all the pairs!  ·  misses: {misses}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
      }}>
        {cards.map((c, i) => {
          const show = c.flipped || c.matched
          return (
            <button key={c.key} onClick={() => flip(i)}
              disabled={show || lock}
              style={{
                width: 56, height: 56, borderRadius: 10,
                border: `2px solid ${ink}`,
                background: c.matched ? '#E7F5E7' : show ? '#fff' : accent,
                cursor: show || lock ? 'default' : 'pointer',
                fontSize: 30, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
                opacity: c.matched ? 0.7 : 1,
              }}
            >{show ? c.face : '❔'}</button>
          )
        })}
      </div>
      <div style={{ fontSize: 12, color: ink, opacity: 0.6 }}>
        {matchedCount / 2} / {FACES.length} pairs
      </div>
    </div>
  )
}
