import { useState, useEffect, useCallback } from 'react'
import type { User } from '../lib/types.ts'

export type AuthState = 'pending' | 'authenticated' | 'unauthenticated'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>('pending')

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          setAuthState('authenticated')
        } else {
          setUser(null)
          setAuthState('unauthenticated')
        }
      })
      .catch(() => {
        setUser(null)
        setAuthState('unauthenticated')
      })
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    setAuthState('unauthenticated')
  }, [])

  return { user, authState, logout }
}
