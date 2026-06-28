'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PetWithCosmetics } from '@/components/Cosmetics'
import { PetDisplayHandle } from '@/components/PetDisplay'
import type { Pet, PetMood, PetAction } from '@/types/pet'

interface PetState { pet: Pet; mood: PetMood; evolved: boolean }

// quick actions available from the floating pet's hover bar
const QUICK: { action: PetAction; icon: string; label: string }[] = [
  { action: 'feed', icon: '🍙', label: 'feed' },
  { action: 'play', icon: '🎮', label: 'play' },
  { action: 'hug',  icon: '♡',  label: 'hug' },
]

// ── Desktop-pet overlay ──────────────────────────────────────
// A transparent, chrome-free view that shows ONLY the pet, meant to be
// loaded inside a frameless/transparent Electron window. The whole pet is
// draggable; a small action bar appears on hover.
export default function OverlayPage() {
  const supabase = createClient()
  const [state, setState] = useState<PetState | null>(null)
  const [user, setUser] = useState<unknown>(null)
  const [hover, setHover] = useState(false)
  const [busy, setBusy] = useState(false)
  const petRef = useRef<PetDisplayHandle>(null)

  // make the page background see-through for the transparent window
  useEffect(() => {
    const prevBody = document.body.style.background
    const prevHtml = document.documentElement.style.background
    document.body.style.background = 'transparent'
    document.documentElement.style.background = 'transparent'
    return () => {
      document.body.style.background = prevBody
      document.documentElement.style.background = prevHtml
    }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [supabase])

  const fetchPet = useCallback(async () => {
    try {
      const res = await fetch('/api/pet')
      const data = await res.json()
      setState(data?.pet ? data : null)
    } catch { /* offline — keep last state */ }
  }, [])

  useEffect(() => { if (user) fetchPet() }, [user, fetchPet])
  useEffect(() => {
    if (!user) return
    const id = setInterval(fetchPet, 30_000)
    return () => clearInterval(id)
  }, [user, fetchPet])

  async function doAction(action: PetAction) {
    if (busy) return
    setBusy(true)
    petRef.current?.playAction(action)
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (res.ok) setTimeout(() => setState(data), 600)
    } catch { /* ignore */ }
    finally { setTimeout(() => setBusy(false), 1200) }
  }

  // signed out / no pet — a tiny prompt to open the main app
  if (!user || !state) {
    return (
      <div style={shellStyle} className="drag">
        <a href="/" target="_blank" rel="noreferrer" style={{
          fontFamily: '"VT323", monospace', fontSize: 16, color: '#7a4a5a',
          background: '#ffffffd0', padding: '8px 14px', borderRadius: 12,
          textDecoration: 'none', border: '2px solid #e3a6b8',
        }}>
          {user ? 'hatch a pet →' : 'sign in →'}
        </a>
      </div>
    )
  }

  const { pet, mood } = state

  return (
    <div
      style={shellStyle}
      className="drag"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <style>{`
        /* draggable surface; interactive bits opt out */
        .drag { -webkit-app-region: drag; }
        .no-drag { -webkit-app-region: no-drag; }
      `}</style>

      {/* hover action bar */}
      <div className="no-drag" style={{
        display: 'flex', gap: 6, marginBottom: 4,
        opacity: hover ? 1 : 0, transform: hover ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity .15s, transform .15s', pointerEvents: hover ? 'auto' : 'none',
      }}>
        {QUICK.map(q => (
          <button key={q.action} onClick={() => doAction(q.action)} disabled={busy}
            title={q.label} aria-label={q.label}
            style={{
              width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
              border: '2px solid #e3a6b8', background: '#fff', fontSize: 16,
              boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
            }}>{q.icon}</button>
        ))}
      </div>

      {/* speech bubble on hover */}
      {hover && (
        <div className="no-drag" style={{
          fontFamily: '"VT323", monospace', fontSize: 14, color: '#5c2a3a',
          background: '#ffffffe8', padding: '3px 10px', borderRadius: 10,
          border: '2px solid #5c2a3a', marginBottom: 2, whiteSpace: 'nowrap',
        }}>{mood.speech}</div>
      )}

      {/* the pet — drag handle */}
      <div onClick={() => doAction('hug')} style={{ cursor: 'grab' }}>
        <PetWithCosmetics ref={petRef} pet={pet} mood={mood} inkColor="#5c2a3a" />
      </div>
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'flex-end',
  background: 'transparent', userSelect: 'none', overflow: 'hidden',
  paddingBottom: 6,
}
