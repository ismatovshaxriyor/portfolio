import type { CSSProperties, ElementType } from 'react'
import { cn } from '@/lib/cn'

interface RainTextProps {
  text: string
  as?: ElementType
  className?: string
  play?: boolean
  staggerMs?: number
  durationMs?: number
  startY?: number
  bounceY?: number
}

export default function RainText({
  text,
  as: Tag = 'span',
  className,
  play = true,
  staggerMs = 28,
  durationMs = 820,
  startY = -68,
  bounceY = 11
}: RainTextProps) {
  return (
    <Tag className={cn('rain-text', play && 'rain-text-active', className)}>
      <span className="sr-only">{text}</span>
      <span className="rain-text-visual" aria-hidden="true">
        {Array.from(text).map((char, index) => {
          const style = {
            '--rain-delay': `${index * staggerMs}ms`,
            '--rain-duration': `${durationMs}ms`,
            '--rain-start-y': `${startY}px`,
            '--rain-bounce-y': `${bounceY}px`
          } as CSSProperties

          return (
            <span key={`${char}-${index}`} className="rain-char" style={style}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          )
        })}
      </span>
    </Tag>
  )
}
