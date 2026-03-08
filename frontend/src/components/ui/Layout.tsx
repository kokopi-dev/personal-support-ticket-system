import type { User } from '../../lib/types.ts'
import { Navbar } from './Navbar.tsx'

interface LayoutProps {
  children: React.ReactNode
  subHeader?: React.ReactNode
  user?: User | null
}

export function Layout({ children, subHeader }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bg-100">
      <Navbar />

      {/* Tab sub-header */}
      {subHeader && (
        <div className="w-full bg-bg-100">
          <div className="mx-auto">
            {subHeader}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-6 py-4">
        {children}
      </main>
    </div>
  )
}
