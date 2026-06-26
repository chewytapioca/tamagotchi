// ============================================================
// random "surprise" events (the coins / gift pop-ups)
// gated by a cooldown on the server so they're occasional treats.
// ============================================================

export interface RandomEvent {
  id: string
  emoji: string
  text: string
  coins: number
}

const EVENTS: RandomEvent[] = [
  { id: 'coins_small', emoji: '🪙', text: 'Found some coins!', coins: 10 },
  { id: 'coins_big',   emoji: '💰', text: 'A coin pouch!',     coins: 18 },
  { id: 'gift',        emoji: '🎁', text: 'Found a little gift!', coins: 14 },
  { id: 'clover',      emoji: '🍀', text: 'Lucky clover!',      coins: 12 },
  { id: 'star',        emoji: '🌟', text: 'A wishing star!',    coins: 15 },
]

// minimum gap between surprise events
export const EVENT_COOLDOWN_MS = 2 * 60 * 60 * 1000  // 2 hours

export function eventReady(lastEvent: string | undefined, now: Date = new Date()): boolean {
  if (!lastEvent) return true
  return now.getTime() - new Date(lastEvent).getTime() >= EVENT_COOLDOWN_MS
}

// pick a surprise (~60% of the time once the cooldown is up)
export function rollEvent(now: Date = new Date()): RandomEvent | null {
  if (Math.random() > 0.6) return null
  return EVENTS[Math.floor(Math.random() * EVENTS.length)]
}
