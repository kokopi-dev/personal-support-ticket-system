import { InfoIcon } from "../icons/info"
import { Button } from "./Button"

interface GuestBannerProps {
  onLogin: () => void
}

export function GuestBanner({ onLogin }: GuestBannerProps) {
  return (
    <div className="w-full border-b border-border-100 bg-bg-200">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-2.5">
        <div className="flex items-center gap-2.5">
          {/* Info icon */}
          <InfoIcon className="shrink-0 text-fg-300 size-4" />
          <p className="text-xs text-fg-300">
            You're in guest mode — tickets are stored locally in your browser.
          </p>
        </div>
        <Button onClick={onLogin} variant="primary">
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
