import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'solid' | 'outline'

type BaseProps = {
  children: ReactNode
  className?: string
  variant?: Variant
}

type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined
  }

type LinkProps = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    href: string
  }

export type Props = ButtonProps | LinkProps

export default function Button(props: Props) {
  const { children, className, variant = 'solid' } = props

  const baseClass =
    'inline-flex items-center justify-center gap-2 border px-4 py-2.5 text-xs font-medium uppercase tracking-[0.18em] transition-all duration-300 ease-system-ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:px-5 sm:tracking-[0.24em]'

  const variantClass =
    variant === 'solid'
      ? 'border-white bg-white text-black hover:bg-black hover:text-white hover:border-white'
      : 'border-white/20 bg-transparent text-white hover:border-white hover:bg-white/5'

  const classes = cn(baseClass, variantClass, className)

  if ('href' in props && props.href) {
    const { href, ...anchorProps } = props
    return (
      <a {...anchorProps} href={href} className={classes}>
        {children}
      </a>
    )
  }

  const buttonProps = props as ButtonProps
  return (
    <button {...buttonProps} className={classes}>
      {children}
    </button>
  )
}
