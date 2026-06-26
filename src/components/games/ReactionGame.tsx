'use client'

import { useEffect, useRef, useState } from 'react'

// Click-the-star: when the star pops up, tap as fast as you can. 3 rounds.
// score = how fast on average (0..1), forwarded to the hub for rewards.
const ROUNDS = 3
const PENALTY_MS = 900

export default function ReactionGame({ onComplete, ink, accent }: {
  onComplete: (score: number) => void
  ink: string
  accent: string
}) {
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'ready'>('idle')
  const [round, setRound] = useState(0)
  const [msg, setMsg] = useState('tap the ⭐ the moment it appears!')
  const timesRef = useRef<number[]>([])
  const startRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function beginRound(n: number) {
    setRound(n)
    setPhase('waiting')
    setMsg('wait for it…')
    const delay = 900 + Math.random() * 2200
    timerRef.current = setTimeout(() => {
      startRef.current = performance.now()
      setPhase('ready')
      setMsg('NOW! tap!')
    }, delay)
  }

  function finish(times: number[]) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const score = Math.max(0, Math.min(1, 1 - (avg - 180) / 620))
    onComplete(score)
  }

  function handleTap() {
    if (phase === 'idle') { timesRef.current = []; beginRound(1); return }

    if (phase === 'waiting') {
      // tapped too early — clear pending timer, count a penalty
      if (timerRef.current) clearTimeout(timerRef.current)
      setMsg('too early! 😖')
      timesRef.current.push(PENALTY_MS)
      advance()
      return
    }

    if (phase === 'ready') {
      const t = performance.now() - startRef.current
      timesRef.current.push(t)
      setMsg(`${Math.round(t)} ms!`)
      advance()
    }
  }

  function advance() {
    const done = timesRef.current.length
    if (done >= ROUNDS) {
      setPhase('idle')
      setTimeout(() => finish(timesRef.current), 600)
    } else {
      setTimeout(() => beginRound(done + 1), 700)
    }
  }

  const bg = phase === 'ready' ? accent : phase === 'waiting' ? '#E8E2DC' : '#fff'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 13, color: ink, minHeight: 18 }}>{msg}</div>
      <button
        onClick={handleTap}
        style={{
          width: 200, height: 200, borderRadius: 20,
          border: `3px solid ${ink}`, background: bg,
          cursor: 'pointer', fontSize: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.05s',
        }}
      >
        {phase === 'ready' ? '⭐' : phase === 'waiting' ? '…' : phase === 'idle' && round === 0 ? '▶' : '⭐'}
      </button>
      <div style={{ fontSize: 12, color: ink, opacity: 0.6 }}>round {Math.min(round, ROUNDS)} / {ROUNDS}</div>
    </div>
  )
}
