import Button from '@/components/ui/Button'

interface ErrorPageProps {
  code: '404' | '500'
  title: string
  description: string
  primaryActionLabel: string
  primaryHref?: string
  onPrimaryAction?: () => void
  secondaryActionLabel?: string
  secondaryHref?: string
  details?: string
}

export default function ErrorPage({
  code,
  title,
  description,
  primaryActionLabel,
  primaryHref,
  onPrimaryAction,
  secondaryActionLabel,
  secondaryHref,
  details
}: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 py-10 text-white sm:px-8">
      <section className="w-full max-w-2xl border border-white/15 bg-black p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">[ error {code} ]</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">{description}</p>

        {details ? (
          <p className="mt-5 border border-white/10 bg-[#050505] p-3 text-xs tracking-[0.06em] text-white/55">{details}</p>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-3">
          {primaryHref ? (
            <Button href={primaryHref} variant="solid">
              {primaryActionLabel}
            </Button>
          ) : (
            <Button onClick={onPrimaryAction} variant="solid">
              {primaryActionLabel}
            </Button>
          )}

          {secondaryActionLabel && secondaryHref ? (
            <Button href={secondaryHref} variant="outline">
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  )
}
