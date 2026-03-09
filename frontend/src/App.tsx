import { useState } from 'react'
import { Layout } from './components/ui/Layout.tsx'
import { Tabs } from './components/ui/Tabs.tsx'
import { UserPage } from './pages/UserPage.tsx'
import { AdminPage } from './pages/AdminPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { useAuth } from './hooks/useAuth.ts'
import { AuthBar } from './components/ui/AuthBar.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { NotFound } from './pages/NotFound.tsx'

type TabValue = 'tickets' | 'admin'

function SupportApp() {
  const [activeTab, setActiveTab] = useState<TabValue>('tickets')
  const [showLogin, setShowLogin] = useState(false)
  const { user, authState, logout } = useAuth()

  const urlError = new URLSearchParams(window.location.search).get('error')

  if (showLogin || urlError) {
    return (
      <Layout>
        <LoginPage
          error={urlError}
          onBack={() => {
            setShowLogin(false)
            window.history.replaceState({}, '', window.location.pathname)
          }}
        />
      </Layout>
    )
  }

  if (authState === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-100">
        <p className="text-sm text-fg-300">Loading...</p>
      </div>
    )
  }

  const tabs: { value: TabValue; label: string }[] = [
    {
      value: 'tickets',
      label: 'My Tickets',
    },
    { value: 'admin', label: 'Admin' },
  ]

  return (
    <Layout
      subHeader={
        <AuthBar user={user} onLogin={() => setShowLogin(true)} onLogout={logout} />
      }
    >
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      {activeTab === 'tickets' && <UserPage isAuthenticated={authState === 'authenticated'} />}
      {activeTab === 'admin' && <AdminPage isAuthenticated={authState === 'authenticated'} user={user} />}
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SupportApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
