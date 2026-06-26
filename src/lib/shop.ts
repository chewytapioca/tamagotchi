import type { Pet, Equipped, EquipSlot, GameId } from '@/types/pet'
import { checkEvolution } from '@/lib/pet'

// ============================================================
// shop catalog + pure economy helpers
// shared by the API routes (server) and the UI (client)
// ============================================================

export type ItemType = EquipSlot | 'decor'

export interface ShopItem {
  id: string
  name: string
  type: ItemType
  price: number
  icon: string            // emoji shown in shop tiles & worn on the pet
  blurb: string           // short flavour text
  minLevel?: number       // pet level required to buy (default 1)
  // backgrounds carry a scene definition used by the renderer
  bg?: { from: string; to: string; scene?: string[] }
}

export const ITEM_TYPES: { type: ItemType; label: string; emoji: string }[] = [
  { type: 'hat',        label: 'Hats',     emoji: '🎩' },
  { type: 'outfit',     label: 'Outfits',  emoji: '👗' },
  { type: 'accessory',  label: 'Accents',  emoji: '👓' },
  { type: 'background', label: 'Scenes',   emoji: '🖼️' },
  { type: 'decor',      label: 'Room',     emoji: '🪴' },
]

export const SHOP_ITEMS: ShopItem[] = [
  // ── hats ──────────────────────────────────────────────
  { id: 'bow_pink',   name: 'Pink Bow',     type: 'hat', price: 30,  icon: '🎀', blurb: 'a classic ribbon' },
  { id: 'cap',        name: 'Ball Cap',     type: 'hat', price: 55,  icon: '🧢', blurb: 'sporty look' },
  { id: 'sunhat',     name: 'Sun Hat',      type: 'hat', price: 75,  icon: '👒', blurb: 'for sunny days' },
  { id: 'flower',     name: 'Flower Crown', type: 'hat', price: 90,  icon: '🌸', blurb: 'spring vibes', minLevel: 2 },
  { id: 'tophat',     name: 'Top Hat',      type: 'hat', price: 120, icon: '🎩', blurb: 'very fancy', minLevel: 3 },
  { id: 'crown',      name: 'Tiny Crown',   type: 'hat', price: 200, icon: '👑', blurb: 'royalty!',    minLevel: 4 },

  // ── outfits ───────────────────────────────────────────
  { id: 'overalls',   name: 'Overalls',     type: 'outfit', price: 70,  icon: '👖', blurb: 'comfy & cute' },
  { id: 'tutu',       name: 'Tutu',         type: 'outfit', price: 85,  icon: '🩰', blurb: 'twirl ready' },
  { id: 'dress',      name: 'Party Dress',  type: 'outfit', price: 100, icon: '👗', blurb: 'dressed up',  minLevel: 2 },
  { id: 'kimono',     name: 'Kimono',       type: 'outfit', price: 140, icon: '👘', blurb: 'elegant',     minLevel: 3 },

  // ── accessories ───────────────────────────────────────
  { id: 'starpin',    name: 'Star Pin',     type: 'accessory', price: 40, icon: '⭐', blurb: 'a little sparkle' },
  { id: 'glasses',    name: 'Glasses',      type: 'accessory', price: 50, icon: '👓', blurb: 'smarty pet' },
  { id: 'scarf',      name: 'Cozy Scarf',   type: 'accessory', price: 55, icon: '🧣', blurb: 'warm & snug' },
  { id: 'shades',     name: 'Cool Shades',  type: 'accessory', price: 75, icon: '🕶️', blurb: 'too cool',   minLevel: 2 },

  // ── backgrounds (scenes) ──────────────────────────────
  { id: 'bg_meadow',  name: 'Meadow',  type: 'background', price: 80,  icon: '🌿', blurb: 'green & breezy',
    bg: { from: '#DFF5DC', to: '#B7E3C8', scene: ['🌿', '🌼', '🌷'] } },
  { id: 'bg_beach',   name: 'Beach',   type: 'background', price: 100, icon: '🏖️', blurb: 'seaside fun',
    bg: { from: '#CFefff', to: '#FCE9C0', scene: ['🌊', '🐚', '⛱️'] }, minLevel: 2 },
  { id: 'bg_night',   name: 'Starry',  type: 'background', price: 120, icon: '🌙', blurb: 'sleepy skies',
    bg: { from: '#2A2A55', to: '#574B8F', scene: ['🌙', '⭐', '✨'] }, minLevel: 2 },
  { id: 'bg_candy',   name: 'Candyland', type: 'background', price: 140, icon: '🍭', blurb: 'so sweet',
    bg: { from: '#FFE0F0', to: '#FFD0C0', scene: ['🍭', '🍬', '🧁'] }, minLevel: 3 },
  { id: 'bg_space',   name: 'Galaxy',  type: 'background', price: 180, icon: '🪐', blurb: 'out of this world',
    bg: { from: '#1B1036', to: '#4B2A6B', scene: ['🪐', '✨', '🚀'] }, minLevel: 4 },

  // ── room decorations ──────────────────────────────────
  { id: 'balloon',    name: 'Balloon',  type: 'decor', price: 30, icon: '🎈', blurb: 'floaty friend' },
  { id: 'plant',      name: 'Plant',    type: 'decor', price: 45, icon: '🪴', blurb: 'a leafy buddy' },
  { id: 'cake',       name: 'Cake',     type: 'decor', price: 55, icon: '🎂', blurb: 'always a party' },
  { id: 'teddy',      name: 'Teddy',    type: 'decor', price: 65, icon: '🧸', blurb: 'snuggly pal' },
  { id: 'lamp',       name: 'Lamp',     type: 'decor', price: 50, icon: '🪔', blurb: 'cozy glow', minLevel: 2 },
]

const MAX_DECOR = 4

const ITEM_BY_ID: Record<string, ShopItem> = Object.fromEntries(
  SHOP_ITEMS.map(i => [i.id, i]),
)

export function getItem(id: string): ShopItem | undefined {
  return ITEM_BY_ID[id]
}

// level mirrors the value shown in the UI (xp / 50 + 1)
export function petLevel(pet: Pick<Pet, 'xp'>): number {
  return Math.floor((pet.xp ?? 0) / 50) + 1
}

export function isOwned(pet: Pick<Pet, 'owned_items'>, id: string): boolean {
  return (pet.owned_items ?? []).includes(id)
}

// ── purchase ────────────────────────────────────────────────
export interface PurchaseResult {
  ok: boolean
  error?: string
  updates?: Partial<Pet>   // { coins, owned_items }
}

export function purchase(pet: Pet, itemId: string): PurchaseResult {
  const item = getItem(itemId)
  if (!item) return { ok: false, error: 'unknown item' }
  if (isOwned(pet, itemId)) return { ok: false, error: 'already owned' }
  if (petLevel(pet) < (item.minLevel ?? 1)) {
    return { ok: false, error: `unlocks at Lv.${item.minLevel}` }
  }
  if ((pet.coins ?? 0) < item.price) return { ok: false, error: 'not enough coins' }

  return {
    ok: true,
    updates: {
      coins: (pet.coins ?? 0) - item.price,
      owned_items: [...(pet.owned_items ?? []), itemId],
    },
  }
}

// ── equip / unequip (toggle) ────────────────────────────────
export interface EquipResult {
  ok: boolean
  error?: string
  updates?: Partial<Pet>   // { equipped }
}

// toggling an owned item: cosmetic slots hold one id (re-equipping the same
// id removes it); decor is a list you can place several of.
export function toggleEquip(pet: Pet, itemId: string): EquipResult {
  const item = getItem(itemId)
  if (!item) return { ok: false, error: 'unknown item' }
  if (!isOwned(pet, itemId)) return { ok: false, error: 'not owned' }

  const equipped: Equipped = { ...(pet.equipped ?? {}) }

  if (item.type === 'decor') {
    const list = [...(equipped.decor ?? [])]
    const at = list.indexOf(itemId)
    if (at >= 0) list.splice(at, 1)
    else {
      if (list.length >= MAX_DECOR) return { ok: false, error: `room is full (max ${MAX_DECOR})` }
      list.push(itemId)
    }
    equipped.decor = list
  } else {
    const slot = item.type as EquipSlot
    equipped[slot] = equipped[slot] === itemId ? undefined : itemId
  }

  return { ok: true, updates: { equipped } }
}

// ── mini-game rewards ───────────────────────────────────────
// score is a normalized 0..1 performance value sent by the client;
// the server caps the payout so a forged score can't mint coins.
interface RewardTable { baseCoins: number; bonusCoins: number; baseXp: number; bonusXp: number }
const GAME_REWARDS: Record<GameId, RewardTable> = {
  memory:   { baseCoins: 6, bonusCoins: 18, baseXp: 4, bonusXp: 10 },
  simon:    { baseCoins: 5, bonusCoins: 20, baseXp: 4, bonusXp: 12 },
  reaction: { baseCoins: 4, bonusCoins: 14, baseXp: 3, bonusXp: 8 },
}

export function isGameId(v: unknown): v is GameId {
  return v === 'memory' || v === 'simon' || v === 'reaction'
}

export interface GameRewardResult {
  updates: Partial<Pet>    // { coins, xp, stage? }
  coins: number
  xp: number
  evolved: boolean
}

export function grantGameReward(pet: Pet, game: GameId, score: number): GameRewardResult {
  const t = GAME_REWARDS[game]
  const s = Math.max(0, Math.min(1, Number.isFinite(score) ? score : 0))
  const coins = Math.round(t.baseCoins + t.bonusCoins * s)
  const xp = Math.round(t.baseXp + t.bonusXp * s)

  const newXp = (pet.xp ?? 0) + xp
  const { evolved, newStage } = checkEvolution(pet.stage, newXp)

  const updates: Partial<Pet> = {
    coins: (pet.coins ?? 0) + coins,
    xp: newXp,
    last_visit: new Date().toISOString(),
  }
  if (evolved && newStage) updates.stage = newStage

  return { updates, coins, xp, evolved }
}
