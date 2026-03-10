import { useState } from "react"
import type { User } from "../../lib/types"
import { InfoIcon } from "../icons/info"
import { CloseIcon } from "../icons/close"
const STORAGE_KEY = "info_bar_dismissed"
interface InfoBarProps {
  user: User | null
}
export function InfoBar({ user }: InfoBarProps) {
  const [open, setOpen] = useState(
    () => localStorage.getItem(STORAGE_KEY) !== "true"
  )
  function toggle() {
    const next = !open
    setOpen(next)
    if (!next) {
      localStorage.setItem(STORAGE_KEY, "true")
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
  const isGuest = user === null
  return (
    <div className="mb-4 rounded-lg border border-border-100 bg-bg-200 overflow-hidden">
      {/* Header row — always visible */}
      <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-2.5" onClick={toggle}>
        <div className="flex items-center gap-2">
          <InfoIcon className="shrink-0 size-4 text-fg-300" />
          <span className="text-xs font-medium text-fg-200">
            {isGuest ? "You're in guest mode" : "How this app works"}
          </span>
        </div>
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 text-xs text-fg-300 transition-colors hover:text-fg-100 cursor-pointer"
          aria-expanded={open}
        >
          {open ? (
            <>
              <CloseIcon className="size-3" />
              <span>Hide</span>
            </>
          ) : (
            <span>Show info</span>
          )}
        </button>
      </div>
      {/* Collapsible body */}
      <div
        className={`transition-[max-height,opacity] duration-200 ease-in-out overflow-hidden ${open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          }`}
        onClick={toggle}
      >
        <div className="border-t border-border-100 py-3">
          <div className="max-w-4xl px-6 mx-auto">
            {isGuest ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 px-2">
                <div className="w-full">
                  <p className="text-xs font-medium text-fg-200">Guest mode</p>
                  <p className="text-xs text-fg-300">
                    Tickets are stored in your browser (localStorage) only.
                    No sync across devices or sessions.
                    Admin panel manages only your tickets.
                  </p>
                </div>
                <div className="w-full">
                  <p className="text-xs font-medium text-fg-200">After signing in</p>
                  <p className="text-xs text-fg-300">
                    Tickets are saved to the server persistently.
                    Admin panel: view all users' tickets.
                    You can only edit or manage your own tickets.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 px-2">
                <div className="w-full">
                  <p className="text-xs font-medium text-fg-200">Tickets and Admin Tab</p>
                  <p className="text-xs text-fg-300">
                    Can create 10 tickets max, each ticket can have 20 replies max.
                    You can view all user tickets in the Admin tab. Useful for monitoring support requests.
                  </p>
                </div>
                <div className="w-full">
                  <p className="text-xs font-medium text-fg-200 pr-1">Editing</p>
                  <p className="text-xs text-fg-300">
                    You can only edit or manage your own tickets. Other users' tickets are read-only for you.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
