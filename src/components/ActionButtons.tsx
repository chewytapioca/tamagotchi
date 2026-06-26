'use client'

import { useState } from 'react'
import type { PetAction } from '@/types/pet'

interface Props {
  onAction: (action: PetAction) => Promise<void>
  disabled?: boolean
}

const ACTIONS: { key: PetAction; label: string; emoji: string }[] = [
  { key: 'feed',  label: 'feed',  emoji: '🍙' },
  { key: 'play',  label: 'play',  emoji: '🎀' },
  { key: 'clean', label: 'clean', emoji: '🫧' },
  { key: 'sleep', label: 'sleep', emoji: '🌙' },
]

export default function ActionButtons({ onAction, disabled }: Props) {
  const [loading, setLoading] = useState<PetAction | null>(null)

  async function handle(action: PetAction) {
    if (loading || disabled) return
    setLoading(action)
    try {
      await onAction(action)
    } finally {
      setTimeout(() => setLoading(null), 600)
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
    }}>
      {ACTIONS.map(({ key, label, emoji }) => {
        const isLoading = loading === key
        const isDisabled = disabled || loading !== null
        return (
          <button
            key={key}
            onClick={() => handle(key)}
            disabled={isDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 0',
              fontSize: '13px',
              borderRadius: '12px',
              border: '0.5px solid var(--color-border-secondary)',
              background: isLoading
                ? 'var(--color-background-secondary)'
                : 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
              cursor: isDisabled ? 'default' : 'pointer',
              opacity: isDisabled && !isLoading ? 0.45 : 1,
              transition: 'background 0.15s, opacity 0.15s',
            }}
          >
            <span role="img" aria-hidden>{emoji}</span>
            {isLoading ? '...' : label}
          </button>
        )
      })}
    </div>
  )
}
