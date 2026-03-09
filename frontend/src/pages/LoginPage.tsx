import { env } from "../env"

interface LoginPageProps {
  onBack?: () => void
  error?: string | null
}

export function LoginPage({ onBack, error }: LoginPageProps) {
  const handleGoogleLogin = () => {
    window.location.href = env.apiUrl + '/api/auth/google'
  }

  const errorMessage = (() => {
    switch (error) {
      case 'oauth_denied': return 'Sign-in was cancelled.'
      case 'invalid_token': return 'Authentication failed — please try again.'
      case 'server_error': return 'Something went wrong — please try again.'
      default: return error ?? null
    }
  })()

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Logo / wordmark */}
      <div className="mb-8 text-center">
        <span className="font-mono text-xl font-semibold tracking-tight text-fg-100">
          Support Ticket Login
        </span>
        <p className="mt-1.5 text-sm text-fg-300">
          The full version uses a database, and admin view shows all tickets. Create a profile with OAuth to experience the full version.
        </p>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-xs text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Card */}
      <div className="overflow-hidden rounded-xl border border-border-100 bg-bg-200">
        <div className="p-6">
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border-200 bg-bg-100 px-4 py-3 text-sm font-medium text-fg-100 transition-colors hover:bg-bg-300 cursor-pointer"
          >
            {/* Google "G" logo */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="border-t border-border-100 px-6 py-4">
          <p className="text-center text-xs text-fg-300">
            We only request your public profile — <span className="text-fg-100">no email address is stored.</span>
          </p>
        </div>
      </div>

      {/* Back link */}
      {onBack && (
        <div className="mt-5 text-center">
          <button
            onClick={onBack}
            className="text-xs text-fg-300 hover:text-fg-200 transition-colors cursor-pointer"
          >
            ← Back to guest mode
          </button>
        </div>
      )}
    </div>
  )
}
