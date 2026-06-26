import type { Weather, TimeOfDay } from '@/types/pet'

// ============================================================
// ambient world: weather, time of day, special days, greetings
// everything here is a pure function of the current date/time —
// no storage, and identical on server & client for a given day.
// ============================================================

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0)
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export interface WeatherInfo {
  kind: Weather
  name: string
  emoji: string
  blurb: string
}

const WEATHER_TABLE: Record<Weather, Omit<WeatherInfo, 'kind'>> = {
  sunny:   { name: 'Sunny',   emoji: '☀️', blurb: 'a bright, happy day!' },
  rainy:   { name: 'Rainy',   emoji: '🌧️', blurb: 'cozy indoor weather' },
  snowy:   { name: 'Snowy',   emoji: '❄️', blurb: 'brr — sleepy & chilly' },
  blossom: { name: 'Blossom', emoji: '🌸', blurb: 'petals in the breeze ♡' },
}

// weighted daily roll (sunny most common)
export function getWeather(now: Date = new Date()): WeatherInfo {
  const r = hashStr('w' + dayKey(now)) % 100
  const kind: Weather =
    r < 45 ? 'sunny' :
    r < 70 ? 'rainy' :
    r < 85 ? 'snowy' : 'blossom'
  return { kind, ...WEATHER_TABLE[kind] }
}

// small passive mood nudge from the weather, applied on visit
export function weatherMood(kind: Weather): { happy?: number; energy?: number } {
  switch (kind) {
    case 'sunny':   return { happy: +2 }
    case 'rainy':   return { energy: +1 }
    case 'snowy':   return { energy: -1 }
    case 'blossom': return { happy: +3 }
  }
}

export function getTimeOfDay(now: Date = new Date()): TimeOfDay {
  const h = now.getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'day'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

const TOD_EMOJI: Record<TimeOfDay, string> = {
  morning: '🌅', day: '🌤️', evening: '🌇', night: '🌙',
}
export function timeOfDayEmoji(t: TimeOfDay): string { return TOD_EMOJI[t] }

// greeting that matches the routine row in the mockup
export function greeting(name: string, now: Date = new Date()): string {
  switch (getTimeOfDay(now)) {
    case 'morning': return `Good morning, ${name}! ☀️`
    case 'day':     return `Let's play, ${name}! 🎮`
    case 'evening': return `Dinner time, ${name}! 🍓`
    case 'night':   return `Good night, ${name}… 🌙`
  }
}

// formatted clock like the mockup header: "10:30 AM"
export function clockLabel(now: Date = new Date()): string {
  let h = now.getHours()
  const m = now.getMinutes().toString().padStart(2, '0')
  const ampm = h < 12 ? 'AM' : 'PM'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

// ── special days ────────────────────────────────────────────
export interface SpecialDay { id: string; name: string; emoji: string; greeting: string }

// bornAt is the pet's birthday; everything else is a fixed calendar date
export function getSpecialDay(bornAt: string | undefined, now: Date = new Date()): SpecialDay | null {
  const mo = now.getMonth() + 1
  const d = now.getDate()

  if (bornAt) {
    const b = new Date(bornAt)
    if (b.getMonth() + 1 === mo && b.getDate() === d &&
        !(b.getFullYear() === now.getFullYear() && b.getMonth() === now.getMonth() && b.getDate() === now.getDate())) {
      return { id: 'birthday', name: 'Birthday', emoji: '🎂', greeting: "it's my birthday! 🎂" }
    }
  }
  if (mo === 10 && d === 31) return { id: 'halloween', name: 'Halloween', emoji: '🎃', greeting: 'spooky day! 🎃' }
  if (mo === 12 && (d === 24 || d === 25)) return { id: 'xmas', name: 'Christmas', emoji: '🎄', greeting: 'merry christmas! 🎄' }
  if ((mo === 12 && d === 31) || (mo === 1 && d === 1)) return { id: 'newyear', name: 'New Year', emoji: '🎉', greeting: 'happy new year! 🎉' }
  return null
}
