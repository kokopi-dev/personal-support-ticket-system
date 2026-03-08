import { Navbar } from './Navbar.tsx'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bg-100">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        {children}
      </main>
    </div>
  )
}
