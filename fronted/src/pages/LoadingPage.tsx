import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import Button from '@/components/ui/Button'

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'OK'

interface BootLog {
  level: LogLevel
  source: string
  message: string
}

interface RenderedLog extends BootLog {
  id: number
  time: string
}

interface LoadingPageProps {
  onContinue: () => void
}

const DJANGO_BOOT_LOGS: readonly BootLog[] = [
  { level: 'INFO', source: 'django.core.management', message: 'Using settings module "config.settings".' },
  { level: 'DEBUG', source: 'django.utils.autoreload', message: 'Watching for file changes with StatReloader.' },
  { level: 'INFO', source: 'django.db.backends', message: 'Database connection established (PostgreSQL).' },
  { level: 'INFO', source: 'django.migrations.executor', message: 'No migrations to apply.' },
  { level: 'DEBUG', source: 'rest_framework.settings', message: 'Loaded DRF default renderer classes.' },
  { level: 'INFO', source: 'django.security.csrf', message: 'CSRF middleware initialized.' },
  { level: 'DEBUG', source: 'celery.worker.consumer', message: 'Broker heartbeat check passed.' },
  { level: 'OK', source: 'django.core.checks', message: 'System check identified no issues (0 silenced).' },
  { level: 'INFO', source: 'django.server', message: 'Starting development server at http://127.0.0.1:8000/' },
  { level: 'INFO', source: 'django.server', message: 'Quit the server with CONTROL-C.' }
]

function formatTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

export default function LoadingPage({ onContinue }: LoadingPageProps) {
  const [logs, setLogs] = useState<RenderedLog[]>([])
  const [progress, setProgress] = useState(7)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)
  const scrollBoxRef = useRef<HTMLDivElement>(null)

  const totalLogs = useMemo(() => DJANGO_BOOT_LOGS.length, [])

  useEffect(() => {
    let index = 0
    const intervalId = window.setInterval(() => {
      if (index >= DJANGO_BOOT_LOGS.length) {
        window.clearInterval(intervalId)
        setProgress(100)
        setAwaitingConfirm(true)
        return
      }

      const log = DJANGO_BOOT_LOGS[index]
      const rendered: RenderedLog = {
        ...log,
        id: index,
        time: formatTime(new Date())
      }

      setLogs((previous) => [...previous.slice(-8), rendered])
      index += 1

      const ratio = index / DJANGO_BOOT_LOGS.length
      setProgress(Math.min(99, Math.round(7 + ratio * 89)))
    }, 130)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!awaitingConfirm) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === 'y' || key === 'enter') {
        event.preventDefault()
        onContinue()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [awaitingConfirm, onContinue])

  useEffect(() => {
    const box = scrollBoxRef.current
    if (!box) {
      return
    }
    box.scrollTop = box.scrollHeight
  }, [logs])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      <section className="relative z-10 w-full max-w-3xl border border-white/15 bg-black/90 p-6 sm:p-8">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center border border-white/15 bg-white/[0.02]">
          <img
            src="/images/logo-transparent.png"
            alt="Shaxriyor Ismatov logo"
            width={24}
            height={24}
            loading="eager"
            className="h-6 w-6 object-contain"
          />
        </div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">[ django boot sequence ]</p>
        <h1 className="mt-3 text-2xl font-medium text-white sm:text-3xl">Initializing Backend Portfolio</h1>

        <div className="mt-6 h-2 w-full overflow-hidden border border-white/20 bg-[#050505]">
          <span
            className="block h-full bg-white transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-white/45">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-signal-blue" />
            <span>Loading modules</span>
          </span>
          <span>
            {logs.length}/{totalLogs} log entries
          </span>
        </div>

        <div ref={scrollBoxRef} className="mt-5 h-48 overflow-y-auto border border-white/10 bg-[#030303] p-3 font-mono">
          <ul className="space-y-1.5">
            {logs.map((line) => (
              <li key={line.id} className="loading-log-line text-[11px] leading-5 text-white/72">
                <span className="text-white/40">[{line.time}]</span>{' '}
                <span
                  className={cn(
                    line.level === 'DEBUG' && 'text-signal-blue/80',
                    line.level === 'WARN' && 'text-signal-red/80',
                    line.level === 'OK' && 'text-white',
                    (line.level === 'INFO' || line.level === 'OK') && 'text-white/85'
                  )}
                >
                  {line.level}
                </span>{' '}
                <span className="text-white/55">{line.source}:</span>{' '}
                <span className="text-white/72">{line.message}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 border border-white/10 bg-[#030303] px-3 py-2.5 font-mono text-[11px] tracking-[0.08em]">
          {awaitingConfirm ? (
            <div className="space-y-3">
              <p className="text-white/80">
                Do you want to continue? <span className="text-signal-blue">[Y/n]</span>
                <span className="ml-1 inline-block w-2 animate-pulse text-white/60">_</span>
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Press Y/Enter or tap button</p>
                <Button type="button" variant="outline" onClick={onContinue} className="w-full sm:w-auto">
                  Continue
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-white/45">Awaiting boot sequence completion...</p>
          )}
        </div>
      </section>
    </main>
  )
}
