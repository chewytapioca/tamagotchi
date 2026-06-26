'use client'

import { useEffect, useRef, useState } from 'react'

// Simon Says: watch the pattern, then repeat it. It grows each round.
const PADS = ['#FF8FA3', '#8FD0FF', '#FFE08F', '#A7E8B0']
const WIN_LEN = 10
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

export default function SimonGame({ onComplete, ink }: {
  onComplete: (score: number) => void
  ink: string
}) {
  const [seq, setSeq] = useState<number[]>([])
  const [phase, setPhase] = useState<'show' | 'input' | 'over' | 'win'>('show')
  const [active, setActive] = useState<number | null>(null)
  const userIdx = useRef(0)
  const finished = useRef(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const after = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)) }
  const rand = () => Math.floor(Math.random() * 4)

  function playSequence(s: number[]) {
    setPhase('show'); setActive(null); userIdx.current = 0
    let t = 450
    s.forEach(pad => {
      after(t, () => setActive(pad))
      after(t + 360, () => setActive(null))
      t += 520
    })
    after(t, () => setPhase('input'))
  }

  useEffect(() => {
    const first = [rand()]
    setSeq(first)
    playSequence(first)
    return () => { timers.current.forEach(clearTimeout); timers.current = [] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tap(i: number) {
    if (phase !== 'input' || finished.current) return
    setActive(i)
    after(170, () => setActive(null))

    if (i !== seq[userIdx.current]) {
      finished.current = true
      setPhase('over')
      after(800, () => onComplete(clamp01((seq.length - 1) / 8)))
      return
    }

    userIdx.current += 1
    if (userIdx.current === seq.length) {
      if (seq.length >= WIN_LEN) {
        finished.current = true
        setPhase('win')
        after(800, () => onComplete(1))
        return
      }
      const ns = [...seq, rand()]
      setSeq(ns)
      after(850, () => playSequence(ns))
    }
  }

  const msg = phase === 'show' ? 'watch closely…'
    : phase === 'input' ? 'your turn!'
    : phase === 'win' ? 'perfect! 🌟'
    : 'oops! 💔'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 13, color: ink }}>{msg}  ·  round {seq.length}</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 96px)', gap: 10,
      }}>
        {PADS.map((color, i) => (
          <button key={i} onClick={() => tap(i)}
            disabled={phase !== 'input'}
            style={{
              width: 96, height: 96, borderRadius: 16,
              border: `3px solid ${ink}`,
              background: color,
              opacity: active === i ? 1 : 0.45,
              transform: active === i ? 'scale(0.96)' : 'scale(1)',
              transition: 'opacity 0.08s, transform 0.08s',
              cursor: phase === 'input' ? 'pointer' : 'default',
            }}
          />
        ))}
      </div>
    </div>
  )
}
