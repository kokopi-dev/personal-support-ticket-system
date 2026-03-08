import { GiteaIcon } from "../icons/gitea";

export function Navbar() {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border-100 bg-bg-100/80 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-6">
          <a href="https://derrickgee.dev"
            className="font-mono text-xs uppercase tracking-widest text-fg-200 transition-colors duration-150 hover:text-fg-100"
          >
              derrickgee.dev
          </a>
          <nav className="flex items-center gap-5">
            <a href="https://git.kokopi.dev/kokopi/personal-support-ticket-system" className="text-xs text-fg-300 transition-colors duration-150 hover:text-fg-100">
              <GiteaIcon className="size-4" />
              gitea
            </a>
          </nav>
        </div>
      </header>
    </>
  )
}
