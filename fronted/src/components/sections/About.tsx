import { useEffect, useMemo, useRef, useState } from 'react'
import { ABOUT_HIGHLIGHTS, ABOUT_TEXT } from '@/lib/data'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { cn } from '@/lib/cn'
import ScrambleHoverText from '@/components/ui/ScrambleHoverText'

const BIRTH_DATE = new Date(2007, 1, 3, 0, 0, 0, 0)
const AGE_REFRESH_MS = 1000

interface AgeBreakdown {
  years: number
  months: number
  days: number
}

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? '' : 's'}`
}

function calculateAgeBreakdown(birthDate: Date, now: Date): AgeBreakdown {
  const end = new Date(now)
  let cursor = new Date(birthDate)
  let years = end.getFullYear() - cursor.getFullYear()
  cursor.setFullYear(cursor.getFullYear() + years)
  if (cursor.getTime() > end.getTime()) {
    years -= 1
    cursor.setFullYear(cursor.getFullYear() - 1)
  }

  let months = 0
  while (months < 12) {
    const next = new Date(cursor)
    next.setMonth(next.getMonth() + 1)
    if (next.getTime() > end.getTime()) {
      break
    }
    months += 1
    cursor = next
  }

  let days = 0
  while (days < 31) {
    const next = new Date(cursor)
    next.setDate(next.getDate() + 1)
    if (next.getTime() > end.getTime()) {
      break
    }
    days += 1
    cursor = next
  }

  return { years, months, days }
}

function formatAge(breakdown: AgeBreakdown): string {
  return [pluralize(breakdown.years, 'year'), pluralize(breakdown.months, 'month'), pluralize(breakdown.days, 'day')].join(', ')
}

function formatDigitalTime(now: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now)
}

export default function About() {
  const [sectionRef, visible] = useIntersectionObserver<HTMLElement>({ threshold: 0.2 })
  const [now, setNow] = useState(() => new Date())
  const [changedClockIndexes, setChangedClockIndexes] = useState<number[]>([])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date())
    }, AGE_REFRESH_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [])

  const ageText = useMemo(() => formatAge(calculateAgeBreakdown(BIRTH_DATE, now)), [now])
  const digitalClock = useMemo(() => formatDigitalTime(now), [now])
  const previousClockRef = useRef(digitalClock)

  useEffect(() => {
    const previous = previousClockRef.current
    const current = digitalClock
    const changed: number[] = []

    for (let i = 0; i < current.length; i += 1) {
      if (current[i] !== previous[i]) {
        changed.push(i)
      }
    }

    setChangedClockIndexes(changed)
    previousClockRef.current = current

    const clearId = window.setTimeout(() => {
      setChangedClockIndexes([])
    }, 460)

    return () => {
      window.clearTimeout(clearId)
    }
  }, [digitalClock])

  const [firstParagraphBeforeAge, firstParagraphAfterAge] = useMemo(() => {
    const template = ABOUT_TEXT[0] ?? '{{age}}'
    const parts = template.split('{{age}}')
    return [parts[0] ?? '', parts.slice(1).join('{{age}}')]
  }, [])
  const otherParagraphs = useMemo(() => ABOUT_TEXT.slice(1), [])

  return (
    <section id="about" ref={sectionRef} className="site-shell section-border py-16 sm:py-20">
      <div className={cn('section-reveal', visible && 'section-reveal-visible')}>
        <header className="mb-10">
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/45">
            <ScrambleHoverText text="/* 04. ABOUT */" />
          </p>
          <div className="h-px w-20 bg-white/25" />
        </header>

        <div className="about-shell grid gap-5 border border-white/10 bg-[#040404] p-6 sm:p-8 lg:grid-cols-[1.14fr_0.86fr]">
          <div className="about-copy space-y-5">
            <p className="text-sm leading-relaxed text-white/72 sm:text-base">
              {firstParagraphBeforeAge}
              <span className="about-age-inline">{ageText}</span>
              <span className="about-inline-clock-wrap" aria-live="polite">
                {' '}
                (
                <span className="about-inline-clock">
                  {digitalClock.split('').map((char, index) => (
                    <span
                      key={index}
                      className={cn('about-inline-clock-char', changedClockIndexes.includes(index) && 'about-inline-clock-char-changed')}
                    >
                      {char}
                    </span>
                  ))}
                </span>
                )
              </span>
              {firstParagraphAfterAge}
            </p>
            {otherParagraphs.map((paragraph) => (
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
