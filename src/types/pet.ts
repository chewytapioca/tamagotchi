export type PetStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult'

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
  born_at: string
  last_decay: string
  last_visit: string
  is_alive: boolean
  created_at: string
}

export type PetAction = 'feed' | 'play' | 'clean' | 'sleep' | 'treat' | 'hug'

export interface StatDelta {
  hunger?: number
  happy?: number
  clean?: number
  energy?: number
  xp?: number
}

export interface PetMood {
  label: 'ecstatic' | 'happy' | 'content' | 'sad' | 'miserable'
  speech: string
}

export interface PetResponse {
  pet: Pet
  mood: PetMood
  evolved: boolean
}