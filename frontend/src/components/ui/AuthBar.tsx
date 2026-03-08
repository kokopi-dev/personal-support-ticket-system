import type { User } from "../../lib/types"
import { GuestBanner } from "./GuestBanner"

interface AuthBarProps {
  isGuest: boolean
  onLogin: () => void
  onLogout: () => void
  user?: User | null
}

export function AuthBar({ isGuest, onLogin, onLogout, user }: AuthBarProps) {
  return (
    <>
      {/* Auth bar — guest strip or user status strip */}
      {isGuest ? (
        <GuestBanner onLogin={onLogin} />
      ) : user ? (
        <div className="w-full border-b border-border-100 bg-bg-200">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-2.5">
            {/* Left: avatar + username */}
            <div className="flex items-center gap-2">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-5 w-5 rounded-full object-cover ring-1 ring-border-100"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-bg-400 ring-1 ring-border-100">
                  <span className="text-[10px] font-medium text-fg-200">
                    {user.username[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs text-fg-200">{user.username}</span>
            </div>

            {/* Right: sign out */}
            <button
              onClick={onLogout}
              className="text-xs text-fg-300 transition-colors hover:text-fg-100 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
