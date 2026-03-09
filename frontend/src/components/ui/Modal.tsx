import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from '../icons/close'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl sm:rounded-lg rounded-t-xl border border-border-100 bg-bg-200 shadow-2xl max-h-[92dvh] sm:max-h-[85dvh] flex flex-col">
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="h-1 w-10 rounded-full bg-border-200" />
        </div>
        <div className="flex items-center justify-between border-b border-border-100 px-5 py-3.5 shrink-0">
          <h2 id="modal-title" className="text-sm font-semibold text-fg-100 truncate pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-fg-300 transition-colors hover:bg-bg-300 hover:text-fg-100 cursor-pointer"
            aria-label="Close"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  )
}
