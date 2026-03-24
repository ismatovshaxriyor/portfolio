import type { ElementType } from 'react'
import { cn } from '@/lib/cn'

interface ScrambleHoverTextProps {
  text: string
  as?: ElementType
  className?: string
  randomPool?: string
  minCycles?: number
  maxCycles?: number
  intervalMs?: number
  minWordDurationMs?: number
  maxWordDurationMs?: number
  playOnMount?: boolean
  mountDelayMs?: number
  cooldownMs?: number
  disabled?: boolean
}

export default function ScrambleHoverText(props: ScrambleHoverTextProps) {
  const Tag = props.as ?? 'span'
  return (
    <Tag
      className={cn('scramble-hover-text', props.className)}
      aria-label={props.text}
    >
      <span className="sr-only">{props.text}</span>
      <span className="scramble-hover-text-visual" aria-hidden="true">
        {props.text}
      </span>
    </Tag>
  )
}
