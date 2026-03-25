import { useEffect, useMemo, useRef, useState } from 'react'
import { IconArrowUpRight, IconGitHub, IconInstagram, IconMail, IconTelegram } from '@/components/icons'
import Button from '@/components/ui/Button'
import RainText from '@/components/ui/RainText'
import ScrambleHoverText from '@/components/ui/ScrambleHoverText'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { CONTACTS } from '@/lib/data'
import { cn } from '@/lib/cn'
import { apiUrl, readEnv } from '@/lib/api'

const CONTACT_ENDPOINT = apiUrl(readEnv('VITE_CONTACT_ENDPOINT') || '/api/contact/')
const COOLDOWN_STORAGE_KEY = 'portfolio_contact_cooldown_until'
const COOLDOWN_MS = 45_000
const MIN_HUMAN_FILL_MS = 3_500
const MESSAGE_MIN_LEN = 5

interface ContactFormData {
  fullName: string
  email: string
  phone: string
  message: string
  website: string
  challenge: string
}

type FieldKey = keyof ContactFormData
type FieldErrors = Partial<Record<FieldKey, string>>

interface Challenge {
  a: number
  b: number
  answer: number
}

function createChallenge(): Challenge {
  const a = 2 + Math.floor(Math.random() * 7)
  const b = 1 + Math.floor(Math.random() * 8)
  return { a, b, answer: a + b }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 16
}

export default function Contact() {
  const [sectionRef, visible] = useIntersectionObserver<HTMLElement>({ threshold: 0.16 })
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    phone: '',
    message: '',
    website: '',
    challenge: ''
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [challenge, setChallenge] = useState<Challenge>(() => createChallenge())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [cooldownLeftMs, setCooldownLeftMs] = useState(0)
  const mountedAtRef = useRef(Date.now())

  const contacts = useMemo(
    () =>
      CONTACTS.map((item) => ({
        ...item,
        icon:
          item.id === 'email'
            ? <IconMail size={20} />
            : item.id === 'telegram'
              ? <IconTelegram size={20} />
              : item.id === 'instagram'
                ? <IconInstagram size={20} />
                : <IconGitHub size={20} />
      })),
    []
  )
  const contactsGridClass =
    contacts.length > 3 ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 xl:col-span-2' : 'grid grid-cols-1 gap-4 xl:col-span-2'

  useEffect(() => {
    const readCooldown = () => {
      const stored = window.localStorage.getItem(COOLDOWN_STORAGE_KEY)
      if (!stored) {
        setCooldownLeftMs(0)
        return
      }

      const until = Number(stored)
      if (!Number.isFinite(until)) {
        setCooldownLeftMs(0)
        return
      }

      setCooldownLeftMs(Math.max(0, until - Date.now()))
    }

    readCooldown()
    const intervalId = window.setInterval(readCooldown, 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  const handleFieldChange = (field: FieldKey, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev
      }
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const nextErrors: FieldErrors = {}
    const cleanFullName = formData.fullName.trim()
    const cleanEmail = formData.email.trim()
    const cleanPhone = formData.phone.trim()
    const cleanMessage = formData.message.trim()
    const challengeValue = Number(formData.challenge.trim())
    const spentMs = Date.now() - mountedAtRef.current

    if (!cleanFullName || cleanFullName.length < 3) {
      nextErrors.fullName = 'Full name must contain at least 3 characters.'
    }
    if (!isValidEmail(cleanEmail)) {
      nextErrors.email = 'Invalid email format.'
    }
    if (!isValidPhone(cleanPhone)) {
      nextErrors.phone = 'Invalid phone number format.'
    }
    if (!cleanMessage || cleanMessage.length < MESSAGE_MIN_LEN) {
      nextErrors.message = `Message must contain at least ${MESSAGE_MIN_LEN} characters.`
    }
    if (!Number.isFinite(challengeValue) || challengeValue !== challenge.answer) {
      nextErrors.challenge = 'Incorrect anti-bot answer.'
    }
    if (spentMs < MIN_HUMAN_FILL_MS) {
      nextErrors.challenge = 'Submitted too quickly. Please try again.'
    }
    if (cooldownLeftMs > 0) {
      nextErrors.message = `Please wait ${Math.ceil(cooldownLeftMs / 1000)}s before sending again.`
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setSubmitState('error')
      setSubmitMessage('Form validation failed.')
      if (nextErrors.challenge) {
        setChallenge(createChallenge())
        setFormData((prev) => ({ ...prev, challenge: '' }))
      }
      return
    }

    if (formData.website.trim().length > 0) {
      setSubmitState('success')
      setSubmitMessage('Message accepted.')
      return
    }

    setIsSubmitting(true)
    setSubmitState('idle')
    setSubmitMessage('')

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000)

    try {
      const payload = {
        full_name: cleanFullName,
        email: cleanEmail,
        phone: cleanPhone,
        message: cleanMessage,
        website: formData.website.trim(),
        challenge_answer: challengeValue,
        client_elapsed_ms: spentMs,
        sent_at: new Date().toISOString(),
        page: window.location.href
      }

      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Contact-Intent': 'portfolio-message-v1'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Contact API failed (${response.status})`)
      }

      const cooldownUntil = Date.now() + COOLDOWN_MS
      window.localStorage.setItem(COOLDOWN_STORAGE_KEY, String(cooldownUntil))
      setCooldownLeftMs(COOLDOWN_MS)

      setSubmitState('success')
      setSubmitMessage('Message sent successfully. I will get back to you soon.')
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        message: '',
        website: '',
        challenge: ''
      })
      setChallenge(createChallenge())
      setFieldErrors({})
    } catch {
      setSubmitState('error')
      setSubmitMessage(`Failed to send message. Endpoint: ${CONTACT_ENDPOINT}`)
    } finally {
      window.clearTimeout(timeoutId)
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" ref={sectionRef} className="site-shell py-16 sm:py-20">
      <div className={cn('section-reveal', visible && 'section-reveal-visible')}>
        <header className="mb-10 text-center">
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/45">
            <ScrambleHoverText text="/* 04. CONTACT */" />
          </p>
          <div className="mx-auto h-px w-20 bg-white/25" />
          <RainText
            as="h2"
            text={"Let's build scalable systems."}
            play={visible}
            className="mt-6 text-2xl font-medium text-white sm:text-4xl"
            durationMs={820}
            staggerMs={24}
            startY={-72}
            bounceY={12}
          />
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
            Open to backend engineering opportunities, architecture challenges, and API-driven product development.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <div className="border border-white/12 bg-[#060606] p-5 xl:col-span-3">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/52">
                <ScrambleHoverText text="[ MESSAGE CHANNEL ]" />
              </p>
              <p
                className={cn(
                  'text-[10px] uppercase tracking-[0.18em]',
                  isSubmitting && 'text-signal-blue/72',
                  !isSubmitting && cooldownLeftMs > 0 && 'text-signal-red/74',
                  !isSubmitting && cooldownLeftMs <= 0 && 'text-white/38'
                )}
              >
                {isSubmitting ? 'TRANSMITTING' : cooldownLeftMs > 0 ? `COOLDOWN ${Math.ceil(cooldownLeftMs / 1000)}S` : 'READY'}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">Full Name</span>
                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={(event) => handleFieldChange('fullName', event.target.value)}
                  className="border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none transition-colors duration-200 placeholder:text-white/25 focus:border-white/45"
                  placeholder="Shaxriyor Ismatov"
                  required
                  aria-invalid={Boolean(fieldErrors.fullName)}
                />
                {fieldErrors.fullName ? <span className="text-[11px] text-signal-red/85">{fieldErrors.fullName}</span> : null}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">Email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(event) => handleFieldChange('email', event.target.value)}
                  className="border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none transition-colors duration-200 placeholder:text-white/25 focus:border-white/45"
                  placeholder="you@example.com"
                  required
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email ? <span className="text-[11px] text-signal-red/85">{fieldErrors.email}</span> : null}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">Phone</span>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(event) => handleFieldChange('phone', event.target.value)}
                  className="border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none transition-colors duration-200 placeholder:text-white/25 focus:border-white/45"
                  placeholder="+998 90 123 45 67"
                  required
                  aria-invalid={Boolean(fieldErrors.phone)}
                />
                {fieldErrors.phone ? <span className="text-[11px] text-signal-red/85">{fieldErrors.phone}</span> : null}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">Anti-Bot Check</span>
                <div className="flex flex-col border border-white/15 bg-black transition-colors duration-200 focus-within:border-white/45 sm:flex-row">
                  <span className="inline-flex min-w-0 items-center justify-center gap-1.5 border-b border-white/15 px-3 py-2 font-mono text-sm tracking-[0.08em] text-white/86 sm:min-w-[138px] sm:border-b-0 sm:border-r sm:tracking-[0.1em]">
                    <span className="text-signal-blue">{challenge.a}</span>
                    <span className="text-white/65">+</span>
                    <span className="text-signal-blue">{challenge.b}</span>
                    <span className="text-white/65">=</span>
                    <span className="text-white">?</span>
                  </span>
                  <input
                    type="text"
                    name="challenge"
                    inputMode="numeric"
                    value={formData.challenge}
                    onChange={(event) => handleFieldChange('challenge', event.target.value)}
                    className="w-full flex-1 bg-transparent px-3 py-2 text-sm tracking-[0.08em] text-white outline-none placeholder:text-white/30"
                    placeholder="Enter result"
                    required
                    aria-invalid={Boolean(fieldErrors.challenge)}
                  />
                </div>
                {fieldErrors.challenge ? <span className="text-[11px] text-signal-red/85">{fieldErrors.challenge}</span> : null}
              </label>

              <label className="md:col-span-2" aria-hidden="true">
                <span className="sr-only">Website</span>
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.website}
                  onChange={(event) => handleFieldChange('website', event.target.value)}
                  name="website"
                  type="text"
                  className="hidden"
                />
              </label>

              <label className="md:col-span-2 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">Message</span>
                <textarea
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={(event) => handleFieldChange('message', event.target.value)}
                  className="resize-y border border-white/15 bg-black px-3 py-2 text-sm leading-relaxed text-white outline-none transition-colors duration-200 placeholder:text-white/25 focus:border-white/45"
                  placeholder="Your project idea, system requirements, or backend challenge..."
                  required
                  aria-invalid={Boolean(fieldErrors.message)}
                />
                {fieldErrors.message ? <span className="text-[11px] text-signal-red/85">{fieldErrors.message}</span> : null}
              </label>

              <div className="md:col-span-2 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className={cn(
                    'text-[11px] uppercase tracking-[0.18em]',
                    submitState === 'success' && 'text-signal-blue/80',
                    submitState === 'error' && 'text-signal-red/80',
                    submitState === 'idle' && 'text-white/35'
                  )}
                >
                  {submitMessage || 'Protected by honeypot + timing + challenge'}
                </p>

                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSubmitting || cooldownLeftMs > 0}
                  className="disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ScrambleHoverText text={isSubmitting ? 'Sending...' : 'Send Message'} playOnMount={false} />
                </Button>
              </div>
            </form>
          </div>

          <div className={contactsGridClass}>
            {contacts.map((contact) => {
              const signalClass =
                contact.signal === 'blue'
                  ? 'hover:border-signal-blue/50 hover:shadow-signal-blue'
                  : 'hover:border-signal-red/50 hover:shadow-signal-red'

              return (
                <a
                  key={contact.id}
                  href={contact.href}
                  target={contact.external ? '_blank' : undefined}
                  rel={contact.external ? 'noreferrer noopener' : undefined}
                  className={cn(
                    'group border border-white/12 bg-[#060606] p-4 text-left transition-all duration-300 ease-system-ease hover:-translate-y-1 sm:p-5',
                    signalClass
                  )}
                >
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center border border-white/20 text-white/70 transition-colors duration-300 group-hover:text-white">
                    {contact.icon}
                  </div>

                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                    <ScrambleHoverText text={contact.label} />
                  </p>
                  <p className="mt-2 text-sm text-white/90">{contact.value}</p>

                  <span className="mt-4 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-white/40 transition-colors duration-300 group-hover:text-white/75">
                    <ScrambleHoverText text="Open" playOnMount={false} /> <IconArrowUpRight size={14} />
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
