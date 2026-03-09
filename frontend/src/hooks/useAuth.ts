import { useState, useEffect, useCallback } from 'react'
import type { User } from '../lib/types.ts'
import { env } from '../env.ts'

export type AuthState = 'pending' | 'authenticated' | 'unauthenticated'

const SESSION_HINT_KEY = 'auth_session_hint'
const hasSessionHint = () => localStorage.getItem(SESSION_HINT_KEY) === 'true'
const setSessionHint = (val: boolean) =>
  val
    ? localStorage.setItem(SESSION_HINT_KEY, 'true')
    : localStorage.removeItem(SESSION_HINT_KEY)

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(
    hasSessionHint() ? 'pending' : 'unauthenticated'
  )

  useEffect(() => {
    const freshLogin = new URLSearchParams(window.location.search).has('login')

    // No hint and not a fresh OAuth redirect → skip the network check entirely.
    if (!hasSessionHint() && !freshLogin) return

    fetch(`${env.apiUrl}/api/auth/me`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('unauthenticated')
        return res.json()
      })
      .then((data: User) => {
        setSessionHint(true)
        setUser(data)
        setAuthState('authenticated')
        // Clean the login param from the URL without triggering a navigation.
        if (freshLogin) window.history.replaceState({}, '', window.location.pathname)
      })
      .catch(() => {
        // Session expired or cookie was cleared — clean up the stale hint.
        setSessionHint(false)
        setUser(null)
        setAuthState('unauthenticated')
      })
  }, [])

  const logout = useCallback(async () => {
    await fetch(`${env.apiUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    setSessionHint(false)
    setUser(null)
    setAuthState('unauthenticated')
  }, [])

  return { user, authState, logout }
}
