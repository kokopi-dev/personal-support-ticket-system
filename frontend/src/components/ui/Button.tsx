import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'purple'

const variants: Record<Variant, string> = {
  primary: 'bg-fg-100 text-bg-100 hover:bg-fg-200 font-medium',
  ghost:   'text-fg-200 hover:bg-bg-300 hover:text-fg-100',
  danger:  'bg-red-900/40 text-red-400 hover:bg-red-900/60',
  purple:  'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 hover:text-purple-300',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm
        transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
