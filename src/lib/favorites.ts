import type { Pet, Favorites } from '@/types/pet'

// ============================================================
// foods (consumable treats) + per-pet taste preferences
// ============================================================

export interface Food {
  id: string
  name: string
  emoji: string
  price: number      // cheap — these are consumables
  hunger: number     // base feed value
  happy: number
}

export const FOODS: Food[] = [
  { id: 'food_strawberry', name: 'Strawberry', emoji: '🍓', price: 8,  hunger: 14, happy: 6 },
  { id: 'food_rice',       name: 'Rice Ball',  emoji: '🍙', price: 6,  hunger: 20, happy: 3 },
  { id: 'food_cake',       name: 'Cake',       emoji: '🍰', price: 12, hunger: 12, happy: 12 },
  { id: 'food_apple',      name: 'Apple',      emoji: '🍎', price: 7,  hunger: 16, happy: 5 },
  { id: 'food_carrot',     name: 'Carrot',     emoji: '🥕', price: 5,  hunger: 15, happy: 3 },
  { id: 'food_broccoli',   name: 'Broccoli',   emoji: '🥦', price: 4,  hunger: 18, happy: 2 },
  { id: 'food_cookie',     name: 'Cookie',     emoji: '🍪', price: 9,  hunger: 10, happy: 9 },
  { id: 'food_fish',       name: 'Fish',       emoji: '🐟', price: 10, hunger: 22, happy: 4 },
]

const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map(f => [f.id, f]))
export function getFood(id: string): Food | undefined { return FOOD_BY_ID[id] }
export function isFood(id: string): boolean { return id in FOOD_BY_ID }

// everyday staples are always available to feed (free, never consumed);
// the rest are treats you buy and stock in the inventory.
export const STAPLE_FOODS = ['food_rice', 'food_apple', 'food_carrot']
export function isStaple(id: string): boolean { return STAPLE_FOODS.includes(id) }

// what a freshly hatched pet starts with in its pantry
export const STARTER_INVENTORY: Record<string, number> = {
  food_strawberry: 2,
  food_cake: 1,
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0)
}

// deterministic, distinct loves / likes / hates picked from FOODS by pet id
export function petFavorites(petId: string): Favorites {
  const n = FOODS.length
  const a = hashStr(petId + ':loves') % n
  let b = hashStr(petId + ':likes') % n
  let c = hashStr(petId + ':hates') % n
  if (b === a) b = (b + 1) % n
  while (c === a || c === b) c = (c + 1) % n
  return { loves: FOODS[a].id, likes: FOODS[b].id, hates: FOODS[c].id }
}

export type Reaction = 'loves' | 'likes' | 'hates' | 'neutral'

export function foodReaction(petId: string, foodId: string): Reaction {
  const fav = petFavorites(petId)
  if (foodId === fav.loves) return 'loves'
  if (foodId === fav.likes) return 'likes'
  if (foodId === fav.hates) return 'hates'
  return 'neutral'
}

// reaction multipliers + bond/coins applied when a food is eaten
export interface FeedOutcome {
  hunger: number; happy: number; affection: number; coins: number; xp: number
  reaction: Reaction; message: string
}

export function feedWithFood(pet: Pet, foodId: string): FeedOutcome | null {
  const food = getFood(foodId)
  if (!food) return null
  const reaction = foodReaction(pet.id, foodId)
  const base: FeedOutcome = {
    hunger: food.hunger, happy: food.happy, affection: 1, coins: 0, xp: 2,
    reaction, message: `${pet.name} ate the ${food.name.toLowerCase()}`,
  }
  switch (reaction) {
    case 'loves':
      return { ...base, happy: food.happy + 14, affection: 4, xp: 5, message: `${pet.name} LOVES ${food.name.toLowerCase()}! ♡♡` }
    case 'likes':
      return { ...base, happy: food.happy + 6, affection: 2, xp: 3, message: `${pet.name} likes ${food.name.toLowerCase()} ♡` }
    case 'hates':
      return { ...base, happy: Math.round(food.happy / 2) - 10, affection: 0, xp: 1, message: `${pet.name} dislikes ${food.name.toLowerCase()}…` }
    default:
      return base
  }
}
