import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onClick' | 'aria-label'> {
  children: ReactNode
  className?: string
  onSelect?: () => void
  ariaLabel?: string
}

export default function Card({ children, className, onSelect, ariaLabel, ...rest }: CardProps) {
  const interactive = typeof onSelect === 'function'

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      {...rest}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'border border-white/10 bg-[#060606] transition-all duration-300 ease-system-ease',
        interactive && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        className
      )}
    >
      {children}
    </div>
  )
}
