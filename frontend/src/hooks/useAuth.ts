import { useState, useEffect, useCallback } from 'react'
import type { User } from '../lib/types.ts'
import { env } from '../env.ts'

export type AuthState = 'pending' | 'authenticated' | 'unauthenticated'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>('pending')

  useEffect(() => {
    fetch(`${env.apiUrl}/api/auth/me`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('unauthenticated')
        return res.json()
      })
      .then((data: User) => {
        setUser(data)
        setAuthState('authenticated')
      })
      .catch(() => {
        setUser(null)
        setAuthState('unauthenticated')
      })
  }, [])

  const logout = useCallback(async () => {
    await fetch(`${env.apiUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
    setAuthState('unauthenticated')
  }, [])

  return { user, authState, logout }
}
