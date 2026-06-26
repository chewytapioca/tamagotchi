import type { Pet, PetStage, StatDelta, PetMood, PetAction } from '@/types/pet'

const DECAY_PER_HOUR: StatDelta = { hunger: -4, happy: -3, clean: -2, energy: -1 }
const DECAY_FLOOR = 5

// added: treat (premium food, more xp & happy) and hug (free affection)
// each action also drips a few coins so the shop economy flows from play.
const ACTION_EFFECTS: Record<PetAction, StatDelta> = {
  feed:  { hunger: +22, clean:  -4,                 xp: 3, coins: 1 },
  play:  { happy:  +20, hunger: -8,  energy: -10,   xp: 5, coins: 2 },
  clean: { clean:  +28, happy:  +5,                 xp: 2, coins: 1 },
  sleep: { energy: +30, hunger: -6,                 xp: 1, coins: 1 },
  treat: { hunger: +12, happy:  +18, clean: -6,     xp: 6, coins: 1 },
  hug:   { happy:  +12, energy: +3,                 xp: 2, coins: 1 },
}

const EVOLUTION_XP: Record<PetStage, number> = {
  egg: 20, baby: 80, child: 200, teen: 450, adult: Infinity,
}

const STAGE_ORDER: PetStage[] = ['egg', 'baby', 'child', 'teen', 'adult']

export function clamp(v: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, v)))
}

function avgStats(pet: Pet): number {
  return (pet.hunger + pet.happy + pet.clean + pet.energy) / 4
}

const SPEECHES: Record<PetMood['label'], string[]> = {
  ecstatic:  ['i love you so much!!', 'best day ever!!', 'yay yay yay!!'],
  happy:     ['feeling good~', 'today is nice', 'thank u ˘ᵕ˘', "i'm okay!"],
  content:   ['...', 'just chilling', 'i missed you', '*blinks*'],
  sad:       ['hungry...', 'feeling lonely', 'please visit more', "i'm cold"],
  miserable: ['please help me...', 'so hungry...', 'i feel terrible', "don't forget me"],
}

export function getMood(pet: Pet): PetMood {
  const avg = avgStats(pet)
  let label: PetMood['label']
  if (avg >= 80)      label = 'ecstatic'
  else if (avg >= 65) label = 'happy'
  else if (avg >= 45) label = 'content'
  else if (avg >= 25) label = 'sad'
  else                label = 'miserable'
  const opts = SPEECHES[label]
  return { label, speech: opts[Math.floor(Math.random() * opts.length)] }
}

export function applyAction(pet: Pet, action: PetAction): {
  updates: Partial<Pet>; delta: StatDelta; evolved: boolean
} {
  const effect = ACTION_EFFECTS[action]
  const newXp = (pet.xp ?? 0) + (effect.xp ?? 0)
  const updates: Partial<Pet> = {
    hunger: clamp(pet.hunger + (effect.hunger ?? 0)),
    happy:  clamp(pet.happy  + (effect.happy  ?? 0)),
    clean:  clamp(pet.clean  + (effect.clean  ?? 0)),
    energy: clamp(pet.energy + (effect.energy ?? 0)),
    xp:     newXp,
    coins:  (pet.coins ?? 0) + (effect.coins ?? 0),
    last_visit: new Date().toISOString(),
  }
  const { evolved, newStage } = checkEvolution(pet.stage, newXp)
  if (evolved && newStage) updates.stage = newStage
  return { updates, delta: effect, evolved }
}

export function applyDecay(pet: Pet): { updates: Partial<Pet>; delta: StatDelta } {
  const now = new Date()
  const lastDecay = new Date(pet.last_decay)
  const hoursElapsed = (now.getTime() - lastDecay.getTime()) / (1000 * 60 * 60)
  const hours = Math.min(hoursElapsed, 48)
  const delta: StatDelta = {
    hunger: Math.round((DECAY_PER_HOUR.hunger ?? 0) * hours),
    happy:  Math.round((DECAY_PER_HOUR.happy  ?? 0) * hours),
    clean:  Math.round((DECAY_PER_HOUR.clean  ?? 0) * hours),
    energy: Math.round((DECAY_PER_HOUR.energy ?? 0) * hours),
  }
  const updates: Partial<Pet> = {
    hunger: clamp(pet.hunger + (delta.hunger ?? 0), DECAY_FLOOR),
    happy:  clamp(pet.happy  + (delta.happy  ?? 0), DECAY_FLOOR),
    clean:  clamp(pet.clean  + (delta.clean  ?? 0), DECAY_FLOOR),
    energy: clamp(pet.energy + (delta.energy ?? 0), DECAY_FLOOR),
    last_decay: now.toISOString(),
  }
  return { updates, delta }
}

export function checkEvolution(currentStage: PetStage, xp: number): {
  evolved: boolean; newStage: PetStage | null
} {
  if (currentStage === 'adult') return { evolved: false, newStage: null }
  const threshold = EVOLUTION_XP[currentStage]
  if (xp >= threshold) {
    const nextIdx = STAGE_ORDER.indexOf(currentStage) + 1
    return { evolved: true, newStage: STAGE_ORDER[nextIdx] }
  }
  return { evolved: false, newStage: null }
}

export function getAgeInDays(bornAt: string): number {
  return Math.floor((Date.now() - new Date(bornAt).getTime()) / (1000 * 60 * 60 * 24))
}

export function getNextEvolutionProgress(pet: Pet): number {
  if (pet.stage === 'adult') return 100
  return Math.min(100, Math.round((pet.xp / EVOLUTION_XP[pet.stage]) * 100))
}