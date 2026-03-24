import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconClose } from '@/components/icons'

interface ModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',')

  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  )
}

export default function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!panelRef.current) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusable = getFocusableElements(panelRef.current)
      if (!focusable.length) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    previousActiveElementRef.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    const frame = window.requestAnimationFrame(() => {
      const focusable = panelRef.current ? getFocusableElements(panelRef.current) : []
      if (focusable.length) {
        focusable[0].focus()
      }
    })

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElementRef.current?.focus()
    }
  }, [handleKeyDown, isOpen])

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-5" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      <div ref={panelRef} className="relative z-10 w-full max-w-6xl border border-white/15 bg-black">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <p className="font-space text-xs uppercase tracking-[0.24em] text-white/60">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-white/20 p-1 text-white/70 transition-colors duration-300 hover:border-white hover:text-white"
            aria-label="Close project details"
          >
            <IconClose size={18} />
          </button>
        </div>
        <div className="max-h-[calc(100vh-7.5rem)] overflow-y-auto overflow-x-hidden p-5 md:p-6 lg:p-7">{children}</div>
      </div>
    </div>,
    document.body
  )
}
