export type PetStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult'

// slots a customization item can occupy
export type EquipSlot = 'hat' | 'outfit' | 'accessory' | 'background'

// what the pet is currently wearing / decorated with.
// single id per cosmetic slot; decor is a list (multiple may be placed)
export interface Equipped {
  hat?: string
  outfit?: string
  accessory?: string
  background?: string
  decor?: string[]
}

export interface Pet {
  id: string
  user_id: string
  name: string
  stage: PetStage
  hunger: number
  happy: number
  clean: number
  energy: number
  xp: number
  coins: number
  owned_items: string[]
  equipped: Equipped
  // bond + collections + progress
  affection: number                       // bond points
  inventory: Record<string, number>       // consumable food: { food_strawberry: 3 }
  counters: Record<string, number>        // lifetime tallies for achievements
  achievements: string[]                  // unlocked achievement ids
  last_event: string                      // cooldown for random events
  born_at: string
  last_decay: string
  last_visit: string
  is_alive: boolean
  created_at: string
}

export type PetAction = 'feed' | 'play' | 'clean' | 'sleep' | 'treat' | 'hug'

export type GameId = 'memory' | 'simon' | 'reaction' | 'catch'

// daily weather, derived from the date (no storage)
export type Weather = 'sunny' | 'rainy' | 'snowy' | 'blossom'

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night'

// a pet's food preferences, derived deterministically from its id
export interface Favorites { loves: string; likes: string; hates: string }

export interface StatDelta {
  hunger?: number
  happy?: number
  clean?: number
  energy?: number
  xp?: number
  coins?: number
}

export interface PetMood {
  label: 'ecstatic' | 'happy' | 'content' | 'sad' | 'miserable' | 'angry' | 'sick'
  speech: string
}

export interface PetResponse {
  pet: Pet
  mood: PetMood
  evolved: boolean
}