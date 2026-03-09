import { useState } from 'react'
import { Button } from '../ui/Button.tsx'
import type { Ticket, TicketType } from '../../lib/types.ts'

// ─── Fake transactions ────────────────────────────────────────────────────────

export interface FakeTransaction {
  id: string
  label: string
  amount: string
  date: string
}

export const FAKE_TRANSACTIONS: FakeTransaction[] = [
  { id: 'TXN-48291', label: 'Pro Plan — Monthly',   amount: '$12.00', date: 'Mar 1, 2026'  },
  { id: 'TXN-47103', label: 'Add-on: Extra Storage', amount: '$4.99',  date: 'Feb 15, 2026' },
  { id: 'TXN-45882', label: 'Pro Plan — Monthly',   amount: '$12.00', date: 'Feb 1, 2026'  },
]

// ─── Step definitions ─────────────────────────────────────────────────────────

interface Option {
  label: string
  description: string
  icon: string
  type: TicketType
  subOptions?: SubOption[]
}

interface SubOption {
  label: string
  description: string
  icon: string
  type: TicketType
}

const CATEGORIES: Option[] = [
  {
    label: 'Something broke',
    description: 'Unexpected behavior or errors',
    icon: '⚠️',
    type: 'bug',
    subOptions: [
      { label: 'Page or feature not loading', description: 'Blank screens, crashes, or freezes', icon: '🖥️', type: 'bug' },
      { label: 'Error message appeared', description: 'Something went wrong unexpectedly', icon: '🔴', type: 'bug' },
      { label: 'Data looks wrong', description: 'Missing or incorrect information', icon: '📊', type: 'bug' },
    ],
  },
  {
    label: 'Billing or payment',
    description: 'Charges, invoices, or subscriptions',
    icon: '💳',
    type: 'billing',
    subOptions: [
      { label: 'Unexpected charge', description: "A charge I didn't expect or recognise", icon: '❓', type: 'billing' },
      { label: 'Refund request', description: "I'd like money returned", icon: '↩️', type: 'billing' },
      { label: 'Subscription issue', description: 'Plan, renewal, or upgrade problem', icon: '🔄', type: 'billing' },
    ],
  },
  {
    label: 'My account',
    description: 'Login, settings, or profile',
    icon: '👤',
    type: 'account',
    subOptions: [
      { label: "Can't sign in", description: 'Login or password issues', icon: '🔐', type: 'account' },
      { label: 'Profile or settings', description: 'Change name, email, or preferences', icon: '⚙️', type: 'account' },
      { label: 'Account access or security', description: 'Suspicious activity or locked out', icon: '🛡️', type: 'account' },
    ],
  },
  {
    label: 'Suggest an idea',
    description: 'Feature requests or improvements',
    icon: '💡',
    type: 'feature-request',
    subOptions: [
      { label: 'New feature idea', description: "Something you'd love to see added", icon: '✨', type: 'feature-request' },
      { label: 'Improve something existing', description: 'Make a current feature better', icon: '🔧', type: 'feature-request' },
      { label: 'Share general feedback', description: 'Thoughts on your experience', icon: '💬', type: 'feedback' },
    ],
  },
  {
    label: 'Something else',
    description: 'Anything not listed above',
    icon: '📝',
    type: 'other',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{ transition: 'background-color 0.4s ease' }}
          className={`h-0.5 flex-1 rounded-full ${
            i < step ? 'bg-fg-100' : i === step ? 'bg-fg-300' : 'bg-border-100'
          }`}
        />
      ))}
    </div>
  )
}

interface OptionCardProps {
  icon: string
  label: string
  description: string
  onClick: () => void
}

function OptionCard({ icon, label, description, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-lg border border-border-100 bg-bg-200 px-4 py-3.5 transition-all duration-150 cursor-pointer hover:border-border-200 hover:bg-bg-300 flex items-start gap-3"
    >
      <span className="mt-0.5 text-lg leading-none select-none">{icon}</span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-fg-100">{label}</span>
        <span className="text-xs text-fg-300 leading-relaxed">{description}</span>
      </div>
      <svg
        className="ml-auto mt-1 shrink-0 text-fg-300 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        width="14" height="14" viewBox="0 0 14 14" fill="none"
      >
        <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

type FormData = Pick<Ticket, 'subject' | 'description' | 'type'>

interface NewTicketFormProps {
  onSubmit: (data: FormData) => void
}

type Step = 'category' | 'sub' | 'details'

const inputClass = `
  w-full rounded-md border border-border-100 bg-bg-300 px-3 py-2 text-sm text-fg-100
  placeholder:text-fg-300 outline-none transition-colors
  focus:border-border-200 focus:ring-1 focus:ring-ring-100
`

export function NewTicketForm({ onSubmit }: NewTicketFormProps) {
  const [step, setStep] = useState<Step>('category')
  const [selectedCategory, setSelectedCategory] = useState<Option | null>(null)
  const [selectedTxn, setSelectedTxn] = useState<string>('')
  const [form, setForm] = useState<FormData>({ subject: '', description: '', type: 'other' })

  const isBilling = form.type === 'billing'
  const stepIndex = step === 'category' ? 0 : step === 'sub' ? 1 : selectedCategory?.subOptions ? 2 : 1
  const totalSteps = selectedCategory?.subOptions ? 3 : 2

  const handleCategorySelect = (cat: Option) => {
    setSelectedCategory(cat)
    if (cat.subOptions) {
      setStep('sub')
    } else {
      setForm(f => ({ ...f, type: cat.type }))
      setStep('details')
    }
  }

  const handleSubSelect = (sub: SubOption) => {
    setForm(f => ({ ...f, type: sub.type }))
    setStep('details')
  }

  const handleBack = () => {
    if (step === 'details' && selectedCategory?.subOptions) {
      setSelectedTxn('')
      setStep('sub')
    } else {
      setSelectedTxn('')
      setStep('category')
      setSelectedCategory(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim()) return
    // Encode transaction reference into description if one was selected
    const txn = FAKE_TRANSACTIONS.find(t => t.id === selectedTxn)
    const descriptionWithTxn = txn
      ? `[Transaction: ${txn.id} — ${txn.label} ${txn.amount} on ${txn.date}]\n\n${form.description}`.trim()
      : form.description
    onSubmit({ ...form, description: descriptionWithTxn })
  }

  return (
    <div className="flex flex-col">
      <StepIndicator step={stepIndex} total={totalSteps} />

      {/* Step 1 — Category */}
      {step === 'category' && (
        <div className="flex flex-col gap-2">
          <div className="mb-3">
            <p className="text-sm font-semibold text-fg-100">What can we help you with?</p>
            <p className="text-xs text-fg-300 mt-0.5">Choose the option that best fits your situation.</p>
          </div>
          {CATEGORIES.map(cat => (
            <OptionCard
              key={cat.type}
              icon={cat.icon}
              label={cat.label}
              description={cat.description}
              onClick={() => handleCategorySelect(cat)}
            />
          ))}
        </div>
      )}

      {/* Step 2 — Sub-options */}
      {step === 'sub' && selectedCategory?.subOptions && (
        <div className="flex flex-col gap-2">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{selectedCategory.icon}</span>
              <span className="text-xs font-medium text-fg-300">{selectedCategory.label}</span>
            </div>
            <p className="text-sm font-semibold text-fg-100">What's the issue specifically?</p>
            <p className="text-xs text-fg-300 mt-0.5">Pick the closest match — we'll route it to the right team.</p>
          </div>
          {selectedCategory.subOptions.map(sub => (
            <OptionCard
              key={sub.type + sub.label}
              icon={sub.icon}
              label={sub.label}
              description={sub.description}
              onClick={() => handleSubSelect(sub)}
            />
          ))}
          <button
            type="button"
            onClick={handleBack}
            className="mt-1 text-xs text-fg-300 hover:text-fg-200 transition-colors text-left cursor-pointer"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 3 — Details */}
      {step === 'details' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="mb-1">
            {selectedCategory && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{selectedCategory.icon}</span>
                <span className="text-xs font-medium text-fg-300">{selectedCategory.label}</span>
                <span className="text-xs text-fg-300">·</span>
                <span className="inline-flex items-center rounded-full border border-border-100 bg-bg-300 px-2 py-0.5 text-xs text-fg-300 capitalize">
                  {form.type.replace('-', ' ')}
                </span>
              </div>
            )}
            <p className="text-sm font-semibold text-fg-100">Tell us what's going on</p>
            <p className="text-xs text-fg-300 mt-0.5">The more detail you share, the faster we can help.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-fg-200">
              Subject <span className="text-fg-300 font-normal">(required)</span>
            </label>
            <input
              className={inputClass}
              placeholder="Brief summary of the issue"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              autoFocus
              required
            />
          </div>

          {isBilling && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-200">
                Related transaction <span className="text-fg-300 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <select
                  className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                  value={selectedTxn}
                  onChange={e => setSelectedTxn(e.target.value)}
                >
                  <option value="">— Not related to a specific charge</option>
                  {FAKE_TRANSACTIONS.map(txn => (
                    <option key={txn.id} value={txn.id}>
                      {txn.id} · {txn.label} · {txn.amount} · {txn.date}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-300"
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {selectedTxn && (() => {
                const txn = FAKE_TRANSACTIONS.find(t => t.id === selectedTxn)!
                return (
                  <div className="rounded-md border border-border-100 bg-bg-300 px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-fg-100">{txn.label}</span>
                      <span className="text-xs text-fg-300">{txn.date}</span>
                    </div>
                    <span className="text-sm font-semibold text-fg-100 shrink-0">{txn.amount}</span>
                  </div>
                )
              })()}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-fg-200">
              Description <span className="text-fg-300 font-normal">(optional)</span>
            </label>
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              placeholder="Describe what happened, what you expected, and any steps to reproduce..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-fg-300 hover:text-fg-200 transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <Button type="submit" disabled={!form.subject.trim()}>
              Submit Ticket
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
