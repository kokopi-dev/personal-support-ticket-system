import { useState } from 'react'
import { Button } from '../ui/Button.tsx'
import type { Ticket, TicketType } from '../../lib/types.ts'

const TICKET_TYPES: { value: TicketType; label: string }[] = [
  { value: 'bug',             label: 'Bug' },
  { value: 'billing',         label: 'Billing' },
  { value: 'account',         label: 'Account' },
  { value: 'feature-request', label: 'Feature Request' },
  { value: 'feedback',     label: 'Feedback' },
  { value: 'other',           label: 'Other' },
]

const inputClass = `
  w-full rounded-md border border-border-100 bg-bg-300 px-3 py-2 text-sm text-fg-100
  placeholder:text-fg-300 outline-none transition-colors
  focus:border-border-200 focus:ring-1 focus:ring-ring-100
`

type FormData = Pick<Ticket, 'subject' | 'description' | 'type'>

interface NewTicketFormProps {
  onSubmit: (data: FormData) => void
}

export function NewTicketForm({ onSubmit }: NewTicketFormProps) {
  const [form, setForm] = useState<FormData>({ subject: '', description: '', type: 'other' })

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-fg-200">Subject</label>
        <input
          className={inputClass}
          placeholder="Brief summary of the issue"
          value={form.subject}
          onChange={set('subject')}
          autoFocus
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-fg-200">Description</label>
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          placeholder="Describe the issue in detail..."
          value={form.description}
          onChange={set('description')}
          rows={4}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit">Create Ticket</Button>
      </div>
    </form>
  )
}
