'use client'

import { useEffect, useRef, useState } from 'react'

// Catch!: tap the falling treats before they hit the ground.
const TOTAL = 12
const FOODS = ['🍓', '🍙', '🍰', '🍎', '🍪', '🐟', '🍇']
const FALL_MS = 2300

interface Drop { key: number; emoji: string; left: number; caught: boolean }

export default function CatchGame({ onComplete, ink, accent }: {
  onComplete: (score: number) => void
  ink: string
  accent: string
}) {
  const [drops, setDrops] = useState<Drop[]>([])
  const [caught, setCaught] = useState(0)
  const caughtRef = useRef(0)
  const doneRef = useRef(0)                   // caught + missed
  const spawned = useRef(0)
  const finished = useRef(false)
  const timers = useRef<ReturnType<typeof setInterval>[]>([])

  useEffect(() => {
    const id = setInterval(() => {
      if (spawned.current >= TOTAL) { clearInterval(id); return }
      spawned.current += 1
      setDrops(d => [...d, {
        key: spawned.current,
        emoji: FOODS[Math.floor(Math.random() * FOODS.length)],
        left: 8 + Math.random() * 78,
        caught: false,
      }])
    }, 720)
    timers.current.push(id)
    return () => { timers.current.forEach(clearInterval); timers.current = [] }
  }, [])

  function settle(d: Drop, didCatch: boolean) {
    if (d.caught) return                       // guard against double-fire
    d.caught = true
    setDrops(cur => cur.filter(x => x.key !== d.key))
    if (didCatch) { caughtRef.current += 1; setCaught(caughtRef.current) }
    doneRef.current += 1
    if (doneRef.current >= TOTAL && !finished.current) {
      finished.current = true
      const score = Math.max(0, Math.min(1, caughtRef.current / TOTAL))
      setTimeout(() => onComplete(score), 400)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 13, color: ink }}>caught {caught} / {TOTAL}</div>
      <div style={{
        position: 'relative', width: 260, height: 240,
        border: `3px solid ${ink}`, borderRadius: 14, overflow: 'hidden',
        background: `linear-gradient(180deg, ${accent}22, #fff)`,
      }}>
        <style>{`@keyframes catch-fall { from { top: -14%; } to { top: 108%; } }`}</style>
        {drops.map(d => (
          <button key={d.key}
            onClick={() => settle(d, true)}
            onAnimationEnd={() => settle(d, false)}
            style={{
              position: 'absolute', left: `${d.left}%`, top: '-14%',
              fontSize: 30, lineHeight: 1, border: 'none', background: 'transparent',
              cursor: 'pointer', padding: 0,
              animation: `catch-fall ${FALL_MS}ms linear forwards`,
            }}
          >{d.emoji}</button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: ink, opacity: 0.6 }}>tap the treats! 🧺</div>
    </div>
  )
}
