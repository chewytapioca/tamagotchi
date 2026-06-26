import type { Pet } from '@/types/pet'
import { getAgeInDays } from '@/lib/pet'

// ============================================================
// affection (bond) tiers + achievements
// ============================================================

const BOND_STEP = 24          // affection points per heart
export const BOND_MAX = 10    // hearts shown in the meter

export function bondLevel(affection: number): number {
  return Math.max(0, Math.min(BOND_MAX, Math.floor((affection ?? 0) / BOND_STEP)))
}

export function bondTier(level: number): string {
  if (level >= 9) return 'Best Friend'
  if (level >= 7) return 'Close Pal'
  if (level >= 5) return 'Good Friend'
  if (level >= 3) return 'Friend'
  if (level >= 1) return 'Acquaintance'
  return 'New Friend'
}

// ── achievements ────────────────────────────────────────────
export interface Achievement {
  id: string
  name: string
  emoji: string
  desc: string
  done: (pet: Pet) => boolean
}

const STAGE_RANK: Record<string, number> = { egg: 0, baby: 1, child: 2, teen: 3, adult: 4 }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_evolution', name: 'First Evolution', emoji: '🥚', desc: 'evolve for the first time',
    done: p => (STAGE_RANK[p.stage] ?? 0) >= 1 },
  { id: 'feed_100', name: 'Well Fed', emoji: '🍙', desc: 'feed your pet 100 times',
    done: p => (p.counters?.feed ?? 0) >= 100 },
  { id: 'level_10', name: 'Level 10', emoji: '⭐', desc: 'reach level 10',
    done: p => Math.floor((p.xp ?? 0) / 50) + 1 >= 10 },
  { id: 'arcade_master', name: 'Arcade Master', emoji: '🎮', desc: 'play 25 arcade games',
    done: p => (p.counters?.games ?? 0) >= 25 },
  { id: 'perfect_week', name: 'Perfect Week', emoji: '📅', desc: 'care for your pet for 7 days',
    done: p => getAgeInDays(p.born_at) >= 7 },
  { id: 'bestie', name: 'Best Friend', emoji: '💗', desc: 'reach max bond',
    done: p => bondLevel(p.affection ?? 0) >= 9 },
  { id: 'collector', name: 'Collector', emoji: '🎁', desc: 'own 5 cosmetic items',
    done: p => (p.owned_items?.length ?? 0) >= 5 },
  { id: 'foodie', name: 'Foodie', emoji: '🍰', desc: 'eat 20 treats',
    done: p => (p.counters?.food_used ?? 0) >= 20 },
]

// all achievement ids currently satisfied by the pet
export function satisfiedAchievements(pet: Pet): string[] {
  return ACHIEVEMENTS.filter(a => a.done(pet)).map(a => a.id)
}

// ids satisfied now but not yet recorded on the pet
export function newlyUnlocked(pet: Pet): string[] {
  const have = new Set(pet.achievements ?? [])
  return satisfiedAchievements(pet).filter(id => !have.has(id))
}

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id)
}
