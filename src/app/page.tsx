'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PetDisplayHandle } from '@/components/PetDisplay'
import { PetWithCosmetics, SceneBackground, RoomDecor } from '@/components/Cosmetics'
import Shop from '@/components/Shop'
import GamesHub from '@/components/GamesHub'
import InfoPanel from '@/components/InfoPanel'
import InventoryBar from '@/components/InventoryBar'
import { getAgeInDays, getNextEvolutionProgress } from '@/lib/pet'
import { bondLevel, bondTier, BOND_MAX, getAchievement } from '@/lib/progress'
import { getWeather, clockLabel, getSpecialDay } from '@/lib/world'
import type { Pet, PetMood, PetAction } from '@/types/pet'

interface PetState { pet: Pet; mood: PetMood; evolved: boolean }

// ── device themes ────────────────────────────────────────────
type ThemeKey = 'sakura' | 'sky' | 'cafe' | 'mint' | 'lavender' | 'sunset'

interface Theme {
  shell: string; shellLight: string; shellDark: string
  bezel: string; bezelInner: string
  screen: string; patternA: string; patternB: string
  ink: string; accent: string
}

const THEMES: Record<ThemeKey, Theme> = {
  sakura: {
    shell: '#FFB6CD', shellLight: '#FFE0E8', shellDark: '#E89BB8',
    bezel: '#D88AA8', bezelInner: '#B8567E',
    screen: '#FFF8F0', patternA: '#FFE8EE', patternB: '#FFF0E0',
    ink: '#5C2A3A', accent: '#E85a7a',
  },
  sky: {
    shell: '#A8D8F0', shellLight: '#D5EBF8', shellDark: '#7EBEE0',
    bezel: '#6BA8D0', bezelInner: '#3D7BA8',
    screen: '#FAFCFF', patternA: '#E0EFFC', patternB: '#FFF0E5',
    ink: '#1F3A60', accent: '#E85a8a',
  },
  cafe: {
    shell: '#F5E5C8', shellLight: '#FFF5DE', shellDark: '#E0C898',
    bezel: '#B8854A', bezelInner: '#8B5A28',
    screen: '#FFFAEC', patternA: '#FFE8D5', patternB: '#F0E0FF',
    ink: '#4A2A10', accent: '#D85a3a',
  },
  mint: {
    shell: '#A8E0C8', shellLight: '#D0EEDC', shellDark: '#78C8A0',
    bezel: '#5AAA85', bezelInner: '#2E7858',
    screen: '#F5FFF8', patternA: '#D8EFE0', patternB: '#FFE8E0',
    ink: '#1A3525', accent: '#E85a7a',
  },
  lavender: {
    shell: '#C8B8E8', shellLight: '#DDD5F0', shellDark: '#A898D0',
    bezel: '#8878B8', bezelInner: '#5A4888',
    screen: '#FAF5FF', patternA: '#E5DAF0', patternB: '#FFE0EA',
    ink: '#2A1850', accent: '#E85a7a',
  },
  sunset: {
    shell: '#FFB87A', shellLight: '#FFDAB0', shellDark: '#E89858',
    bezel: '#D87838', bezelInner: '#A85618',
    screen: '#FFF8EC', patternA: '#FFE5D0', patternB: '#FFF5D0',
    ink: '#5A2810', accent: '#E84B5A',
  },
}

// ── actions with distinct colors ─────────────────────────────
interface ActionConfig {
  key: PetAction; label: string; icon: string
  color: string; colorDark: string
  particles: string[]
  msg: (n: string) => string
}

const ACTIONS: ActionConfig[] = [
  { key: 'feed',  label: 'feed',  icon: '🍙', color: '#FF9755', colorDark: '#D87538',
    particles: ['🍙','♡','✦'],     msg: n => `${n} is munching ♡` },
  { key: 'play',  label: 'play',  icon: '🎀', color: '#FF7BA5', colorDark: '#D85a85',
    particles: ['✦','⋆','♪','✧'],  msg: n => `${n} is having fun!` },
  { key: 'clean', label: 'clean', icon: '🫧', color: '#6BB5E8', colorDark: '#4895C8',
    particles: ['○','◦','✦'],      msg: n => `${n} is squeaky clean ✨` },
  { key: 'treat', label: 'treat', icon: '🍰', color: '#F5C656', colorDark: '#D5A636',
    particles: ['🍰','♡','✦'],     msg: n => `yum! ${n} loves this` },
  { key: 'hug',   label: 'hug',   icon: '♡',  color: '#E85a7a', colorDark: '#B83a5a',
    particles: ['♡','♥','♡','♥'], msg: n => `${n} loves you ♡` },
  { key: 'sleep', label: 'sleep', icon: '☾',  color: '#A88AC8', colorDark: '#7858A8',
    particles: ['Z','z','Z','z'],  msg: n => `${n} is sleeping zzz` },
]

function moodMessage(name: string, mood: PetMood['label']): string {
  const messages: Record<PetMood['label'], string[]> = {
    ecstatic:  [`${name} is overjoyed!`, `${name} adores you!`, `best day ever!`],
    happy:     [`${name} is happy ✿`, `${name} feels good`, `${name} is cheerful`],
    content:   [`${name} is chilling`, `${name} is content`, `all is well ♡`],
    sad:       [`${name} is feeling down...`, `${name} needs you`, `${name} is hungry...`],
    miserable: [`${name} is miserable :(`, `please help ${name}!`, `${name} needs care!`],
    angry:     [`${name} is cranky!`, `${name} wants attention!`, `${name} is upset...`],
    sick:      [`${name} feels unwell...`, `${name} needs a bath & rest`, `${name} is poorly...`],
  }
  const opts = messages[mood]
  return opts[Math.floor(Math.random() * opts.length)]
}

const STATS = [
  { key: 'hunger' as const, label: 'HUN', icon: '♥', color: '#E85a5a' },
  { key: 'happy'  as const, label: 'HAP', icon: '✿', color: '#E85a8a' },
  { key: 'clean'  as const, label: 'CLN', icon: '✧', color: '#5aB8E8' },
  { key: 'energy' as const, label: 'ENR', icon: '⚡', color: '#E8B85a' },
]

function ActionParticles({ action }: { action: PetAction | null }) {
  if (!action) return null
  const config = ACTIONS.find(a => a.key === action)!
  const particles = Array.from({ length: 7 }, (_, i) => ({
    char: config.particles[i % config.particles.length],
    left: 12 + i * 12 + Math.random() * 6,
    delay: i * 0.09,
    size: 14 + Math.random() * 6,
  }))
  return (
    <>
      <style>{`@keyframes float-up {
        0%{transform:translateY(0) scale(0.3);opacity:0}
        15%{opacity:1}
        100%{transform:translateY(-100px) scale(1.1);opacity:0}
      }`}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, overflow: 'hidden' }}>
        {particles.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', bottom: '40%', left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animation: `float-up 1.8s ease-out ${p.delay}s forwards`,
            opacity: 0, fontWeight: 'bold',
          }}>{p.char}</div>
        ))}
      </div>
    </>
  )
}

// ── background floating sparkles (very subtle) ───────────────
function BackgroundFloaters({ accent }: { accent: string }) {
  const items = Array.from({ length: 14 }, (_, i) => ({
    char: ['♡', '✦', '⋆', '✧', '❀'][i % 5],
    left: (i * 7.2) % 100,
    delay: (i * 1.1) % 9,
    duration: 16 + (i % 5) * 2,
    size: 9 + (i % 3) * 3,
  }))
  return (
    <>
      <style>{`@keyframes bg-float {
        0%{transform:translateY(110vh) rotate(0);opacity:0}
        10%{opacity:0.18}
        90%{opacity:0.18}
        100%{transform:translateY(-10vh) rotate(360deg);opacity:0}
      }`}</style>
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${it.left}%`,
            fontSize: `${it.size}px`, color: accent,
            animation: `bg-float ${it.duration}s linear ${it.delay}s infinite`,
          }}>{it.char}</div>
        ))}
      </div>
    </>
  )
}

export default function HomePage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [state, setState] = useState<PetState | null>(null)
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [evolvedMsg, setEvolvedMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeBtn, setActiveBtn] = useState<PetAction | null>(null)
  const [particleAction, setParticleAction] = useState<PetAction | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [themeKey, setThemeKey] = useState<ThemeKey>('sakura')
  const [showThemes, setShowThemes] = useState(false)
  const [panel, setPanel] = useState<'shop' | 'games' | 'info' | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [offline, setOffline] = useState<{ awayMs: number; delta: Record<string, number> } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const petRef = useRef<PetDisplayHandle>(null)
  const theme = THEMES[themeKey]

  // ticking clock for the device header
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  // briefly surface a toast (events, food reactions, achievements)
  const flashToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(t => (t === msg ? null : t)), 3500)
  }, [])

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('tamago-theme') : null
    if (saved && saved in THEMES) setThemeKey(saved as ThemeKey)
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('tamago-theme', themeKey)
  }, [themeKey])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchPet = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const res = await fetch('/api/pet')
      const data = await res.json()
      setState(data.pet ? data : null)
      if (data.pet) setStatusMsg(moodMessage(data.pet.name, data.mood.label))
      if (data.offline) setOffline(data.offline)
      if (data.event) flashToast(`${data.event.emoji} ${data.event.text} +${data.event.coins}🪙`)
      if (data.unlocked?.length) flashToast(`🏆 ${getAchievement(data.unlocked[0])?.name ?? 'Achievement'} unlocked!`)
    } catch { setError('failed to load pet') }
    finally { setLoading(false) }
  }, [user, flashToast])

  useEffect(() => { fetchPet() }, [fetchPet])
  useEffect(() => {
    const interval = setInterval(fetchPet, 30_000)
    return () => clearInterval(interval)
  }, [fetchPet])

  useEffect(() => {
    if (!state) return
    const id = setInterval(() => {
      setStatusMsg(moodMessage(state.pet.name, state.mood.label))
    }, 8000)
    return () => clearInterval(id)
  }, [state])

  async function handleAction(action: PetAction) {
    setActiveBtn(action); setError(null)
    petRef.current?.playAction(action)
    setParticleAction(action)
    setTimeout(() => setParticleAction(null), 1900)
    const cfg = ACTIONS.find(a => a.key === action)!
    if (state) setStatusMsg(cfg.msg(state.pet.name))

    const res = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    setTimeout(() => setActiveBtn(null), 1900)
    if (!res.ok) { setError(data.error); return }
    setTimeout(() => setState(data), 700)
    if (data.evolved) {
      setTimeout(() => {
        setEvolvedMsg(`✦ ${data.pet.name} evolved! ✦`)
        setTimeout(() => setEvolvedMsg(null), 4500)
      }, 1900)
    }
  }

  // called by Shop / GamesHub / InventoryBar after a mutation succeeds
  function applyPetState(data: PetState & { unlocked?: string[]; message?: string }) {
    setState({ pet: data.pet, mood: data.mood, evolved: data.evolved })
    if (data.message) setStatusMsg(data.message)
    if (data.evolved) {
      setEvolvedMsg(`✦ ${data.pet.name} evolved! ✦`)
      setTimeout(() => setEvolvedMsg(null), 4500)
    }
    if (data.unlocked?.length) flashToast(`🏆 ${getAchievement(data.unlocked[0])?.name ?? 'Achievement'} unlocked!`)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true); setError(null)
    const res = await fetch('/api/pet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setCreating(false); return }
    setState(data); setCreating(false); setNewName('')
  }

  // pixel font (loaded from google fonts in <head>)
  const pxFont = { fontFamily: '"VT323", "Press Start 2P", "Courier New", monospace', letterSpacing: '0.04em' }
  const titleFont = { fontFamily: '"Press Start 2P", "VT323", monospace' }

  const screenPattern = () => (
    <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.25 }}>
      <defs>
        <pattern id={`pat-${themeKey}`} width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="11" height="11" fill={theme.patternA}/>
          <rect x="11" y="11" width="11" height="11" fill={theme.patternA}/>
          <rect x="11" width="11" height="11" fill={theme.patternB}/>
          <rect y="11" width="11" height="11" fill={theme.patternB}/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#pat-${themeKey})`}/>
    </svg>
  )

  // ── action button with own color + simpler shadows ──
  const ActionButton = ({ cfg, prominent }: { cfg: ActionConfig; prominent?: boolean }) => {
    const size = prominent ? 72 : 62
    const active = activeBtn === cfg.key
    return (
      <button
        onClick={() => state && handleAction(cfg.key)}
        disabled={!state || activeBtn !== null}
        aria-label={cfg.label}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          border: `2px solid ${cfg.colorDark}`,
          background: active
            ? cfg.colorDark
            : `linear-gradient(180deg, ${cfg.color} 0%, ${cfg.colorDark} 100%)`,
          boxShadow: active
            ? `inset 0 2px 5px rgba(0,0,0,0.25)`
            : `inset 0 2px 0 rgba(255,255,255,0.35), 0 2px 4px rgba(0,0,0,0.15)`,
          cursor: state && !activeBtn ? 'pointer' : 'default',
          transition: 'all 0.08s',
          transform: active ? 'translateY(3px)' : 'translateY(0)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '1px', padding: 0,
        }}
      >
        <span style={{ fontSize: prominent ? '24px' : '20px' }}>{cfg.icon}</span>
        <span style={{
          fontSize: prominent ? '11px' : '10px',
          color: '#fff', fontWeight: 700,
          letterSpacing: '0.05em', textTransform: 'uppercase',
          textShadow: '0 1px 0 rgba(0,0,0,0.3)',
          ...titleFont,
        }}>
          {cfg.label}
        </span>
      </button>
    )
  }

  const Shell = ({ screenContent }: { screenContent: React.ReactNode }) => (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 20% 20%, ${theme.shellLight} 0%, transparent 55%),
        radial-gradient(circle at 80% 80%, ${theme.shell}aa 0%, transparent 55%),
        ${theme.screen}
      `,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', position: 'relative', ...pxFont,
    }}>
      {/* google fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet"/>

      <BackgroundFloaters accent={theme.accent}/>

      {/* theme picker */}
      <button
        onClick={() => setShowThemes(!showThemes)}
        aria-label="change theme"
        style={{
          position: 'fixed', top: '16px', right: '16px',
          width: '44px', height: '44px', borderRadius: '50%',
          border: `2px solid ${theme.ink}33`,
          background: `linear-gradient(160deg, ${theme.shellLight}, ${theme.shellDark})`,
          cursor: 'pointer', fontSize: '20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >🎨</button>

      {showThemes && (
        <div style={{
          position: 'fixed', top: '68px', right: '16px',
          background: '#fff', borderRadius: '14px', padding: '10px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: `1px solid ${theme.ink}22`, zIndex: 50,
        }}>
          {(Object.keys(THEMES) as ThemeKey[]).map(k => (
            <button
              key={k}
              onClick={() => { setThemeKey(k); setShowThemes(false) }}
              aria-label={k}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: themeKey === k ? `3px solid ${THEMES[k].ink}` : `2px solid ${THEMES[k].bezel}`,
                background: `linear-gradient(160deg, ${THEMES[k].shellLight} 0%, ${THEMES[k].shellDark} 100%)`,
                cursor: 'pointer', padding: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* egg-shaped device */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: '440px',
        background: `linear-gradient(165deg, ${theme.shellLight} 0%, ${theme.shell} 50%, ${theme.shellDark} 100%)`,
        borderRadius: '46% 46% 42% 42% / 52% 52% 38% 38%',
        padding: '3rem 1.8rem 3rem',
        boxShadow: `inset 0 -10px 20px ${theme.shellDark}88, 0 12px 32px ${theme.shellDark}66`,
        border: `3px solid ${theme.bezel}`,
        zIndex: 1,
      }}>
        {/* glossy plastic highlight */}
        <div aria-hidden style={{
          position: 'absolute',
          top: '5%', left: '10%', right: '10%', height: '28%',
          background: `linear-gradient(180deg, ${theme.shellLight}cc 0%, transparent 100%)`,
          borderRadius: '50%',
          filter: 'blur(6px)',
          pointerEvents: 'none',
          opacity: 0.7,
        }}/>

        {/* secondary subtle highlight (curved sheen) */}
        <div aria-hidden style={{
          position: 'absolute',
          top: '20%', left: '15%', width: '20%', height: '8%',
          background: '#fff',
          borderRadius: '50%',
          filter: 'blur(8px)',
          opacity: 0.5,
          pointerEvents: 'none',
        }}/>

        {/* top decoration */}
        <div style={{
          position: 'absolute', top: '14px', left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '16px', color: theme.ink,
          ...pxFont, letterSpacing: '8px', opacity: 0.6,
        }}>⋆ ♡ ⋆ ♡ ⋆</div>

        {/* speaker holes */}
        <div aria-hidden style={{
          position: 'absolute', top: '38px', left: '24px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px',
        }}>
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: theme.bezel, opacity: 0.5,
            }}/>
          ))}
        </div>

        {/* LED + battery */}
        <div aria-hidden style={{
          position: 'absolute', top: '40px', right: '28px',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, #fff, ${theme.accent})`,
            boxShadow: `0 0 8px ${theme.accent}cc`,
            animation: 'led-blink 2.5s ease-in-out infinite',
          }}/>
          <style>{`@keyframes led-blink { 0%,80%,100%{opacity:1} 90%{opacity:0.3} }`}</style>
        </div>

        {/* branding */}
        <div style={{
          textAlign: 'center', marginBottom: '14px', marginTop: '6px',
          fontSize: '12px', letterSpacing: '0.35em',
          color: theme.ink, fontWeight: 700,
          ...titleFont,
        }}>
          TAMAGO
        </div>

        {/* LCD bezel */}
        <div style={{
          background: `linear-gradient(160deg, ${theme.bezel} 0%, ${theme.bezelInner} 100%)`,
          padding: '14px', borderRadius: '20px',
          boxShadow: `inset 0 3px 8px ${theme.bezelInner}cc`,
          border: `2px solid ${theme.bezel}`,
        }}>
          {/* bezel info row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 4px 10px', fontSize: '11px',
            color: theme.shellLight, fontWeight: 700,
            ...pxFont, letterSpacing: '0.12em',
          }}>
            <span>● ●</span>
            <span style={{ fontSize: '13px', ...titleFont, fontWeight: 'normal' }}>
              LV.{state ? Math.floor(state.pet.xp / 50) + 1 : 1}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <span style={{
                display: 'inline-block', width: '20px', height: '10px',
                border: `2px solid ${theme.shellLight}`, borderRadius: '2px',
                padding: '1px',
              }}>
                <span style={{
                  display: 'block',
                  width: state ? `${state.pet.energy}%` : '70%',
                  height: '100%', background: theme.shellLight,
                  transition: 'width 0.6s ease',
                }}/>
              </span>
              <span style={{
                display: 'inline-block', width: '2px', height: '6px',
                background: theme.shellLight,
              }}/>
            </span>
          </div>

          {/* screen */}
          <div style={{
            background: theme.screen, borderRadius: '14px',
            padding: '14px 14px 12px', minHeight: '340px',
            position: 'relative', overflow: 'hidden',
            boxShadow: `inset 0 2px 6px ${theme.bezelInner}55`,
            display: 'flex', flexDirection: 'column',
          }}>
            {/* faded pattern */}
            {screenPattern()}
            {/* equipped scene background (covers pattern when set) */}
            <SceneBackground backgroundId={state?.pet.equipped?.background}/>
            {/* scanlines */}
            <div aria-hidden style={{
              position: 'absolute', inset: 0,
              background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${theme.ink}0a 2px, ${theme.ink}0a 3px)`,
              pointerEvents: 'none',
            }}/>
            {/* glossy reflection */}
            <div aria-hidden style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 25%, transparent 75%, rgba(255,255,255,0.06) 100%)`,
              pointerEvents: 'none',
            }}/>
            <ActionParticles action={particleAction}/>
            {screenContent}
            {/* room decorations along the bottom */}
            <RoomDecor decor={state?.pet.equipped?.decor}/>
          </div>
        </div>

        {/* button grid — 3×2 balanced */}
        {state && (
          <>
            {/* shop + arcade + more menu */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              {([
                { key: 'shop' as const, label: 'SHOP', icon: '🛍' },
                { key: 'games' as const, label: 'ARCADE', icon: '🎮' },
                { key: 'info' as const, label: 'INFO', icon: '📖' },
              ]).map(m => (
                <button key={m.key}
                  onClick={() => setPanel(m.key)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: '12px',
                    border: `2px solid ${theme.ink}`,
                    background: `linear-gradient(180deg, ${theme.shellLight}, ${theme.shell})`,
                    color: theme.ink, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.12)`,
                    ...titleFont,
                  }}
                ><span style={{ fontSize: '16px' }}>{m.icon}</span>{m.label}</button>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px 8px',
              justifyItems: 'center',
              marginTop: '14px',
            }}>
              <ActionButton cfg={ACTIONS[0]} prominent/>  {/* feed */}
              <ActionButton cfg={ACTIONS[1]} prominent/>  {/* play */}
              <ActionButton cfg={ACTIONS[2]}/>             {/* clean */}
              <ActionButton cfg={ACTIONS[3]}/>             {/* treat */}
              <ActionButton cfg={ACTIONS[4]}/>             {/* hug */}
              <ActionButton cfg={ACTIONS[5]}/>             {/* sleep */}
            </div>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                onClick={() => supabase.auth.signOut()}
                style={{
                  fontSize: '12px', padding: '4px 12px', borderRadius: '99px',
                  border: `1px solid ${theme.ink}33`, background: 'transparent',
                  color: theme.ink, cursor: 'pointer',
                  ...pxFont, letterSpacing: '0.1em', opacity: 0.65,
                }}
              >sign out</button>
            </div>
          </>
        )}

        <div style={{
          position: 'absolute', bottom: '14px', left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px', color: theme.ink, opacity: 0.35,
          ...pxFont, letterSpacing: '6px',
        }}>⋆ ｡ ⋆ ｡ ⋆</div>
      </div>

      {/* evolution banner */}
      {evolvedMsg && (
        <div style={{
          position: 'fixed', top: '40px', left: '50%',
          transform: 'translateX(-50%)',
          background: '#fff',
          border: `3px solid ${theme.ink}`,
          color: theme.ink, padding: '14px 28px',
          borderRadius: '99px', fontSize: '13px', fontWeight: 700,
          boxShadow: `0 8px 24px ${theme.bezelInner}88`,
          zIndex: 100, ...titleFont,
        }}>
          {evolvedMsg}
        </div>
      )}
    </div>
  )

  if (!user) return (
    <Shell screenContent={
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, textAlign:'center', position:'relative', zIndex:1 }}>
        <div style={{ fontSize: '64px', marginBottom: '12px' }}>🥚</div>
        <p style={{ fontSize: '12px', color: theme.ink, margin: '0 0 6px', letterSpacing: '0.2em', fontWeight: 700, ...titleFont }}>WELCOME!</p>
        <p style={{ fontSize: '14px', color: theme.ink, opacity: 0.7, margin: '0 0 22px', lineHeight: 1.4, ...pxFont }}>
          a tiny friend who<br/>lives on the server
        </p>
        <a href="/auth" style={{
          padding: '10px 24px', fontSize: '11px',
          borderRadius: '99px', border: `2px solid ${theme.ink}`,
          color: theme.ink, textDecoration: 'none', background: '#fff',
          fontWeight: 700, letterSpacing: '0.18em', ...titleFont,
        }}>SIGN IN</a>
      </div>
    }/>
  )

  if (loading) return (
    <Shell screenContent={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, position:'relative', zIndex:1 }}>
        <p style={{ fontSize: '16px', color: theme.ink, ...pxFont, letterSpacing: '0.3em' }}>...loading...</p>
      </div>
    }/>
  )

  if (!state) return (
    <Shell screenContent={
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, textAlign:'center', position:'relative', zIndex:1 }}>
        <div style={{ fontSize: '56px', marginBottom: '10px' }}>🥚</div>
        <p style={{ fontSize: '12px', color: theme.ink, margin: '0 0 6px', fontWeight: 700, letterSpacing: '0.18em', ...titleFont }}>HATCH AN EGG</p>
        <p style={{ fontSize: '13px', color: theme.ink, opacity: 0.7, margin: '0 0 14px', ...pxFont }}>give it a name ♡</p>
        <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:'10px', alignItems:'center' }}>
          <input
            value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="mochi" maxLength={20}
            style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '16px',
              width: '160px', border: `2px solid ${theme.ink}`,
              background: '#fff', color: theme.ink,
              textAlign: 'center', outline: 'none', ...pxFont,
            }}
            autoFocus
          />
          <button type="submit" disabled={creating || !newName.trim()}
            style={{
              padding: '8px 22px', borderRadius: '99px', fontSize: '11px',
              border: `2px solid ${theme.ink}`, background: '#fff', color: theme.ink,
              cursor: 'pointer', fontWeight: 700, letterSpacing: '0.15em', ...titleFont,
            }}
          >HATCH</button>
        </form>
        {error && <p style={{ fontSize: '13px', color: '#c44', marginTop: '8px', ...pxFont }}>{error}</p>}
      </div>
    }/>
  )

  const { pet, mood } = state
  const age = getAgeInDays(pet.born_at)
  const evoProgress = getNextEvolutionProgress(pet)
  const currentLevel = Math.floor(pet.xp / 50) + 1
  const weather = getWeather(now)
  const special = getSpecialDay(pet.born_at, now)
  const bond = bondLevel(pet.affection ?? 0)
  const clock = clockLabel(now)

  const screenContent = (
    <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', height:'100%', flex:1, gap:'5px' }}>
      {/* top: name + stage */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '14px', color: theme.ink, fontWeight: 700,
        ...pxFont, letterSpacing: '0.05em',
      }}>
        <span style={{ background: '#ffffffee', padding: '2px 8px', borderRadius: '4px' }}>♡ {pet.name}</span>
        <span style={{ background: '#ffffffee', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }} title="coins">
          🪙 {pet.coins}
        </span>
        <span style={{ background: '#ffffffee', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}
          title={`${weather.name} · ${pet.stage}`}>
          {weather.emoji} Day {age + 1} · {clock}
        </span>
      </div>

      {/* special-day banner */}
      {special && (
        <div style={{
          textAlign: 'center', fontSize: '12px', color: theme.ink, fontWeight: 700,
          background: `${theme.accent}22`, border: `1.5px solid ${theme.accent}`,
          borderRadius: '8px', padding: '3px 8px', ...pxFont,
        }}>
          {special.emoji} {special.name}! — {special.greeting}
        </div>
      )}

      {/* pet — BIG and centered */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', margin: '4px 0',
        flexShrink: 0,
      }}>
        <PetWithCosmetics ref={petRef} pet={pet} mood={mood} onPet={fetchPet} inkColor={theme.ink}/>
      </div>

      {/* affection / bond hearts */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        fontSize: '12px', color: theme.ink, ...pxFont,
      }} title={`${bondTier(bond)} — ${bond}/${BOND_MAX}`}>
        <span>{Array.from({ length: BOND_MAX }).map((_, i) => i < bond ? '💗' : '🤍').join('')}</span>
        <span style={{ fontWeight: 700 }}>{bondTier(bond)}</span>
      </div>

      {/* status message */}
      <div style={{
        textAlign: 'center', margin: '2px auto',
        fontSize: '14px', color: theme.ink,
        background: '#ffffffee',
        padding: '4px 12px', borderRadius: '10px',
        border: `1.5px solid ${theme.ink}33`,
        maxWidth: '90%', fontWeight: 600,
        ...pxFont,
      }}>
        {statusMsg || moodMessage(pet.name, mood.label)}
      </div>

      {/* stat bars - cleaner contrast */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '3px',
        background: '#ffffffcc', padding: '6px 8px',
        borderRadius: '8px', border: `1.5px solid ${theme.ink}22`,
      }}>
        {STATS.map(({ key, label, icon, color }) => {
          const value = pet[key] as number
          const low = value <= 25
          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '13px', ...pxFont,
            }}>
              <span style={{ width:'15px', color: low ? '#c44' : color, fontSize:'14px', fontWeight: 700 }}>{icon}</span>
              <span style={{
                width: '28px', color: low ? '#c44' : theme.ink,
                fontWeight: 700, letterSpacing: '0.03em',
                ...titleFont, fontSize: '9px',
              }}>{label}</span>
              <div style={{
                flex: 1, height: '10px',
                background: '#fff', border: `2px solid ${theme.ink}`,
                padding: '1px', display: 'flex', gap: '1px',
                borderRadius: '3px',
              }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1,
                    background: i < Math.floor(value / 10) ? (low ? '#c44' : color) : 'transparent',
                    animation: low && i < Math.floor(value / 10) ? 'pulse 1.5s ease-in-out infinite' : undefined,
                  }}/>
                ))}
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
              </div>
              <span style={{
                width: '26px', textAlign: 'right',
                color: low ? '#c44' : theme.ink,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 700, fontSize: '13px',
              }}>{value}</span>
            </div>
          )
        })}
      </div>

      {/* XP/Level - prominent */}
      {pet.stage !== 'adult' && (
        <div style={{
          background: `linear-gradient(135deg, ${theme.accent}22 0%, ${theme.shellLight}88 100%)`,
          padding: '6px 10px', borderRadius: '8px',
          border: `2px solid ${theme.accent}`,
          boxShadow: `0 0 0 1px ${theme.shellLight}`,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '10px', color: theme.ink, fontWeight: 700,
            letterSpacing: '0.08em', marginBottom: '4px', ...titleFont,
          }}>
            <span>⭐ LV.{currentLevel} → LV.{currentLevel + 1}</span>
            <span>{evoProgress}%</span>
          </div>
          <div style={{
            height: '10px', background: '#fff',
            border: `2px solid ${theme.ink}`, borderRadius: '3px',
            overflow: 'hidden', position: 'relative',
          }}>
            <div style={{
              width: `${evoProgress}%`, height: '100%',
              background: `linear-gradient(90deg, ${theme.accent} 0%, #F5C656 100%)`,
              transition: 'width 0.6s ease',
              boxShadow: `inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)`,
            }}/>
          </div>
        </div>
      )}

      {/* treats inventory — tap to feed */}
      <InventoryBar pet={pet} ink={theme.ink} onResult={applyPetState}/>

      {error && <p style={{ fontSize: '12px', color: '#c44', margin: 0, textAlign: 'center', ...pxFont }}>{error}</p>}
    </div>
  )

  return (
    <>
      <Shell screenContent={screenContent}/>
      {panel === 'shop' && (
        <Shop
          pet={pet} ink={theme.ink} accent={theme.accent}
          onClose={() => setPanel(null)}
          onUpdate={applyPetState}
        />
      )}
      {panel === 'games' && (
        <GamesHub
          pet={pet} ink={theme.ink} accent={theme.accent}
          onClose={() => setPanel(null)}
          onUpdate={applyPetState}
        />
      )}
      {panel === 'info' && (
        <InfoPanel
          pet={pet} ink={theme.ink} accent={theme.accent}
          onClose={() => setPanel(null)}
        />
      )}

      {/* toast (events, food reactions, achievements) */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#fff', border: `2px solid ${theme.ink}`, color: theme.ink,
          padding: '10px 18px', borderRadius: '99px', fontSize: '13px', fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 150, maxWidth: '90%',
          textAlign: 'center', ...pxFont,
        }}>{toast}</div>
      )}

      {/* offline / welcome-back summary */}
      {offline && (
        <div onClick={() => setOffline(null)} style={{
          position: 'fixed', inset: 0, zIndex: 210, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, ...pxFont,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#FFF8F4', borderRadius: 20, padding: '20px 22px', maxWidth: 320,
            border: `3px solid ${theme.ink}`, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40 }}>😴</div>
            <p style={{ fontSize: 12, color: theme.ink, ...titleFont, margin: '8px 0' }}>WELCOME BACK!</p>
            <p style={{ fontSize: 14, color: theme.ink, opacity: 0.75, margin: '0 0 12px' }}>
              you were away for {formatAway(offline.awayMs)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: 14, color: theme.ink }}>
              {STATS.map(({ key, icon }) => {
                const d = offline.delta[key] ?? 0
                return <span key={key}>{icon} {d > 0 ? '+' : ''}{d}</span>
              })}
            </div>
            <button onClick={() => setOffline(null)} style={{
              marginTop: 16, padding: '8px 22px', borderRadius: 99,
              border: `2px solid ${theme.ink}`, background: theme.accent, color: '#fff',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', ...titleFont,
            }}>OK ♡</button>
          </div>
        </div>
      )}
    </>
  )
}

function formatAway(ms: number): string {
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}