'use client'

import type { Pet } from '@/types/pet'

interface Props { pet: Pet }

const STATS = [
  { key: 'hunger', label: 'hunger', color: '#F0997B' },
  { key: 'happy',  label: 'happy',  color: '#ED93B1' },
  { key: 'clean',  label: 'clean',  color: '#9FE1CB' },
  { key: 'energy', label: 'energy', color: '#AFA9EC' },
] as const

function barColor(value: number, defaultColor: string): string {
  if (value <= 20) return '#F09595'
  if (value <= 40) return '#FAC775'
  return defaultColor
}

export default function StatBars({ pet }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {STATS.map(({ key, label, color }) => {
        const value = pet[key as keyof Pet] as number
        const fill = barColor(value, color)
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{
              width: '48px',
              flexShrink: 0,
              color: 'var(--color-text-secondary)',
            }}>
              {label}
            </span>
            <div style={{
              flex: 1,
              height: '7px',
              background: 'var(--color-border-tertiary)',
              borderRadius: '99px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${value}%`,
                height: '100%',
                background: fill,
                borderRadius: '99px',
                transition: 'width 0.5s ease, background 0.3s ease',
              }}/>
            </div>
            <span style={{
              width: '24px',
              textAlign: 'right',
              fontSize: '11px',
              color: value <= 20 ? 'var(--color-text-danger)' : 'var(--color-text-tertiary)',
              fontWeight: value <= 20 ? 500 : 400,
            }}>
              {value}
            </span>
          </div>
        )
      })}
    </div>
  )
}
