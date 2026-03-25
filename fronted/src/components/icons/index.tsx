import type { FC } from 'react'

export interface IconProps {
  className?: string
  size?: number
}

const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
}

export const IconArrowRight: FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </svg>
)

export const IconArrowUpRight: FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <path d="M7 17 17 7" />
    <path d="M9 7h8v8" />
  </svg>
)

export const IconClose: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

export const IconTerminal: FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <path d="m4 7 6 5-6 5" />
    <path d="M13 18h7" />
  </svg>
)

export const IconServer: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <rect x="3" y="3" width="18" height="7" rx="1.8" />
    <rect x="3" y="14" width="18" height="7" rx="1.8" />
    <path d="M7 7h.01" />
    <path d="M7 18h.01" />
  </svg>
)

export const IconDatabase: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <ellipse cx="12" cy="5" rx="8.5" ry="2.7" />
    <path d="M3.5 5v14c0 1.5 3.8 2.7 8.5 2.7s8.5-1.2 8.5-2.7V5" />
    <path d="M3.5 12c0 1.5 3.8 2.7 8.5 2.7s8.5-1.2 8.5-2.7" />
  </svg>
)

export const IconApi: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <path d="M4 8h6" />
    <path d="M4 16h6" />
    <path d="M14 6h6" />
    <path d="M14 12h6" />
    <path d="M14 18h6" />
    <path d="M10 8h4" />
    <path d="M10 16h4" />
  </svg>
)

export const IconBot: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M12 10V4" />
    <circle cx="12" cy="3" r="1" />
    <path d="M9 14h.01" />
    <path d="M15 14h.01" />
  </svg>
)

export const IconCode: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <path d="m8 6-5 6 5 6" />
    <path d="m16 6 5 6-5 6" />
    <path d="m14.5 4-5 16" />
  </svg>
)

export const IconLayers: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <path d="m12 3-8 4.5 8 4.5 8-4.5-8-4.5Z" />
    <path d="m4 12 8 4.5 8-4.5" />
    <path d="m4 16.5 8 4.5 8-4.5" />
  </svg>
)

export const IconTooling: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.3 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1.1 1.6V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.6-1.1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1.1 1.6 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1.1Z" />
  </svg>
)

export const IconConcept: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <path d="M12 3v18" />
    <path d="M3 12h18" />
    <path d="m5.6 5.6 12.8 12.8" />
    <path d="m18.4 5.6-12.8 12.8" />
  </svg>
)

export const IconGrid: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <rect x="3" y="3" width="8" height="8" />
    <rect x="13" y="3" width="8" height="8" />
    <rect x="3" y="13" width="8" height="8" />
    <rect x="13" y="13" width="8" height="8" />
  </svg>
)

export const IconCpu: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <rect x="7" y="7" width="10" height="10" rx="1" />
    <path d="M9 1v4" />
    <path d="M15 1v4" />
    <path d="M9 19v4" />
    <path d="M15 19v4" />
    <path d="M1 9h4" />
    <path d="M1 15h4" />
    <path d="M19 9h4" />
    <path d="M19 15h4" />
  </svg>
)

export const IconMail: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <rect x="2.5" y="4" width="19" height="16" rx="2" />
    <path d="m3 6 9 7 9-7" />
  </svg>
)

export const IconTelegram: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <path d="M21.7 3.7 2.6 10.8c-1 .4-1 1.1-.2 1.4l4.8 1.5 11.2-7c.5-.3 1-.1.6.2L8.3 16.2 8 21c.4 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8L22 5c.3-1.3-.5-1.9-2.3-1.3Z" />
  </svg>
)

export const IconGitHub: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <path d="M9.2 19c-5 1.6-5-2.3-7-3" />
    <path d="M16 22v-3.8a3.3 3.3 0 0 0-.9-2.5c3-.3 6.2-1.5 6.2-6.8a5.3 5.3 0 0 0-1.4-3.7 4.9 4.9 0 0 0-.1-3.5S18.7 1.3 16 3a12 12 0 0 0-7.8 0C5.5 1.3 4.2 1.7 4.2 1.7a4.9 4.9 0 0 0-.1 3.5 5.3 5.3 0 0 0-1.4 3.7c0 5.3 3.1 6.5 6.2 6.8a3.3 3.3 0 0 0-.9 2.5V22" />
  </svg>
)

export const IconInstagram: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.3" cy="6.7" r="0.8" />
  </svg>
)
