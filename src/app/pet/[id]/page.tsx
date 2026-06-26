import { createServiceClient } from '@/lib/supabase/server'
import { getMood, getAgeInDays } from '@/lib/pet'
import type { Pet } from '@/types/pet'

interface Props {
  params: { id: string }
}

export default async function PublicPetPage({ params }: Props) {
  const supabase = createServiceClient()

  const { data: pet, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !pet) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>pet not found :(</p>
      </main>
    )
  }

  const mood = getMood(pet as Pet)
  const age = getAgeInDays(pet.born_at)

  const STAT_COLORS: Record<string, string> = {
    hunger: '#F0997B', happy: '#ED93B1', clean: '#9FE1CB', energy: '#AFA9EC',
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '300px',
        width: '100%',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
          {pet.name}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '0 0 20px' }}>
          {pet.stage} · {age} days old
        </p>

        {/* simple static pet face for public view */}
        <div style={{ fontSize: '64px', lineHeight: 1, marginBottom: '16px' }}>
          {pet.stage === 'egg' ? '🥚' : pet.stage === 'baby' ? '🐣' : pet.stage === 'child' ? '🐥' : pet.stage === 'teen' ? '🐓' : '🦜'}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 20px', fontStyle: 'italic' }}>
          "{mood.speech}"
        </p>

        {/* stat bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '20px' }}>
          {(['hunger', 'happy', 'clean', 'energy'] as const).map(key => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span style={{ width: '48px', textAlign: 'left', color: 'var(--color-text-tertiary)' }}>{key}</span>
              <div style={{ flex: 1, height: '6px', background: 'var(--color-border-tertiary)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${pet[key]}%`, height: '100%', background: STAT_COLORS[key], borderRadius: '99px' }}/>
              </div>
            </div>
          ))}
        </div>

        <a
          href="/"
          style={{
            display: 'inline-block',
            fontSize: '13px',
            padding: '8px 20px',
            borderRadius: '10px',
            border: '0.5px solid var(--color-border-secondary)',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
          }}
        >
          hatch your own egg
        </a>
      </div>
    </main>
  )
}

export async function generateMetadata({ params }: Props) {
  const supabase = createServiceClient()
  const { data: pet } = await supabase.from('pets').select('name, stage').eq('id', params.id).single()
  return {
    title: pet ? `${pet.name} the ${pet.stage} · tamago` : 'tamago',
  }
}
