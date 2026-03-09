import type { User } from "../../lib/types"
import { GuestBanner } from "./GuestBanner"

interface AuthBarProps {
  user: User | null
  onLogin: () => void
  onLogout: () => void
}

export function AuthBar({ user, onLogin, onLogout }: AuthBarProps) {
  if (!user) return <GuestBanner onLogin={onLogin} />

  return (
    <div className="w-full border-b border-border-100 bg-bg-200">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-2.5">
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

        <button
          onClick={onLogout}
          className="text-xs text-fg-300 transition-colors hover:text-fg-100 cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
