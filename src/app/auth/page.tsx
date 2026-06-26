'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage({ text: error.message, ok: false })
      } else {
        setMessage({ text: 'check your email to confirm your account!', ok: true })
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ text: error.message, ok: false })
      } else {
        router.push('/')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '20px',
        padding: '2rem',
        width: '100%',
        maxWidth: '300px',
      }}>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🐣</p>
          <h1 style={{ fontSize: '18px', fontWeight: 500, margin: '0 0 4px' }}>tamago</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
            {mode === 'login' ? 'welcome back!' : 'hatch your first egg'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ fontSize: '14px' }}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ fontSize: '14px' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px',
              fontSize: '14px',
              borderRadius: '10px',
              border: '0.5px solid var(--color-border-secondary)',
              background: 'var(--color-background-secondary)',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginTop: '4px',
            }}
          >
            {loading ? '...' : mode === 'login' ? 'sign in' : 'create account'}
          </button>
        </form>

        {message && (
          <p style={{
            fontSize: '13px',
            marginTop: '12px',
            textAlign: 'center',
            color: message.ok ? 'var(--color-text-success)' : 'var(--color-text-danger)',
          }}>
            {message.text}
          </p>
        )}

        <p style={{ fontSize: '13px', textAlign: 'center', marginTop: '16px', marginBottom: 0, color: 'var(--color-text-secondary)' }}>
          {mode === 'login' ? "don't have an account? " : 'already have one? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null) }}
            style={{ background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-primary)', textDecoration: 'underline', padding: 0 }}
          >
            {mode === 'login' ? 'sign up' : 'sign in'}
          </button>
        </p>
      </div>
    </main>
  )
}
