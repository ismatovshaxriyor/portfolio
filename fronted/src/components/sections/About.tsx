import { ABOUT_HIGHLIGHTS, ABOUT_TEXT } from '@/lib/data'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { cn } from '@/lib/cn'
import ScrambleHoverText from '@/components/ui/ScrambleHoverText'

export default function About() {
  const [sectionRef, visible] = useIntersectionObserver<HTMLElement>({ threshold: 0.2 })

  return (
    <section id="about" ref={sectionRef} className="site-shell section-border py-16 sm:py-20">
      <div className={cn('section-reveal', visible && 'section-reveal-visible')}>
        <header className="mb-10">
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/45">
            <ScrambleHoverText text="/* 03. ABOUT */" />
          </p>
          <div className="h-px w-20 bg-white/25" />
        </header>

        <div className="about-shell grid gap-5 border border-white/10 bg-[#040404] p-6 sm:p-8 lg:grid-cols-[1.14fr_0.86fr]">
          <div className="about-copy space-y-5">
            {ABOUT_TEXT.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-sm leading-relaxed text-white/72 sm:text-base">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="about-rail grid gap-3">
            {ABOUT_HIGHLIGHTS.map((item, index) => (
              <article
                key={item.title}
                style={{ transitionDelay: `${index * 90}ms` }}
                className={cn(
                  'about-card border border-white/10 bg-black/40 p-4',
                  visible && 'about-card-visible'
                )}
              >
                <p className={cn('text-[11px] uppercase tracking-[0.22em]', item.title === 'Mission' ? 'text-signal-red/70' : 'text-white/45')}>
                  <ScrambleHoverText text={item.title} playOnMount={false} />
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/72">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
