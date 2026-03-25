import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import RainText from '@/components/ui/RainText'
import ScrambleHoverText from '@/components/ui/ScrambleHoverText'
import { HERO_ROLES } from '@/lib/data'
import type { HeroStat } from '@/lib/types'
import { IconArrowRight } from '@/components/icons'
import { useTypingEffect } from '@/hooks/useTypingEffect'
import { useCanvasAnimation } from '@/hooks/useCanvasAnimation'
import { useLivePing } from '@/hooks/useLivePing'
import { cn } from '@/lib/cn'

function formatUptime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const startedAtRef = useRef(Date.now())
  useCanvasAnimation(canvasRef)

  const { text, isHolding } = useTypingEffect(HERO_ROLES)
  const { latencyMs, isOnline } = useLivePing()
  const [uptimeSeconds, setUptimeSeconds] = useState(0)

  useEffect(() => {
    const update = () => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
      setUptimeSeconds(elapsed)
    }

    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const runtimeWorkers = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return 'WORKERS: UNKNOWN'
    }
    const threads = navigator.hardwareConcurrency
    if (!threads || threads < 1) {
      return 'WORKERS: UNKNOWN'
    }
    return `WORKERS: ${threads} THREADS READY`
  }, [])

  const queueStatus = useMemo(() => {
    if (!isOnline) {
      return 'OFFLINE'
    }
    if (latencyMs === null) {
      return 'SYNCING'
    }
    if (latencyMs > 260) {
      return 'CONGESTED'
    }
    if (latencyMs > 140) {
      return 'VARIABLE'
    }
    return 'STABLE'
  }, [isOnline, latencyMs])

  const stats = useMemo<HeroStat[]>(() => {
    const latencySignal = !isOnline ? 'red' : latencyMs === null ? undefined : latencyMs > 220 ? 'red' : 'blue'
    const latencyValue = !isOnline ? 'TIMEOUT' : latencyMs === null ? '---' : `${latencyMs}ms`

    return [
      { label: 'SYS', value: isOnline ? 'ONLINE' : 'DEGRADED', signal: isOnline ? 'blue' : 'red' },
      { label: 'UPTIME', value: formatUptime(uptimeSeconds), signal: 'blue' },
      { label: 'LATENCY', value: latencyValue, signal: latencySignal }
    ]
  }, [isOnline, latencyMs, uptimeSeconds])

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden border-b border-white/10 bg-black pt-20 sm:min-h-screen sm:pt-24"
    >
      <canvas ref={canvasRef} className="gpu-layer pointer-events-none absolute inset-0 z-0 opacity-60" />
      <div className="scanline-overlay gpu-layer" aria-hidden="true" />

      <div className="pointer-events-none absolute left-5 top-28 z-10 hidden space-y-2 text-[11px] uppercase tracking-[0.22em] text-white/55 sm:block">
        {stats.map((stat) => (
          <p
            key={stat.label}
            className={
              stat.signal === 'blue'
                ? 'text-signal-blue/80'
                : stat.signal === 'red'
                  ? 'text-signal-red/80'
                  : 'text-white/55'
            }
          >
            [ {stat.label}: {stat.value} ]
          </p>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-14 right-5 z-10 hidden space-y-2 text-right text-[10px] uppercase tracking-[0.22em] text-white/35 lg:block">
        <p className={cn(latencyMs === null && 'text-white/35', latencyMs !== null && isOnline && 'text-signal-blue/72', !isOnline && 'text-signal-red/78')}>
          BOOT: {latencyMs === null ? 'INIT' : 'COMPLETE'}
        </p>
        <p
          className={cn(
            (queueStatus === 'CONGESTED' || queueStatus === 'OFFLINE') && 'text-signal-red/80',
            queueStatus === 'VARIABLE' && 'text-signal-red/65',
            queueStatus === 'STABLE' && 'text-white/35',
            queueStatus === 'SYNCING' && 'text-signal-blue/68'
          )}
        >
          QUEUE: {queueStatus}
        </p>
        <p>{runtimeWorkers}</p>
      </div>

      <div className="site-shell relative z-20 -mt-2 sm:-mt-6 md:-mt-10">
        <div className="max-w-3xl pl-0 sm:pl-4 md:pl-6">
          <p className="mb-4 inline-flex border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/60 sm:tracking-[0.24em]">
            <ScrambleHoverText text="backend engineer aesthetic" />
          </p>

          <RainText
            as="h1"
            text="Shaxriyor Ismatov"
            className="text-balance font-space text-3xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl"
            durationMs={900}
            staggerMs={34}
            startY={-86}
            bounceY={14}
          />

          <p className="mt-6 flex min-h-9 items-center gap-2.5 text-sm uppercase tracking-[0.14em] text-white/80 sm:gap-3 sm:text-lg sm:tracking-[0.2em]">
            <span className="text-signal-blue">&gt;</span>
            <span>{text}</span>
            <span className={isHolding ? 'cursor-blink text-signal-blue' : 'text-signal-blue'}>|</span>
          </p>

          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
            Backend developer focused on Python, Django, DRF, and scalable Telegram systems. I design APIs and architecture that stay predictable under load.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
            <Button href="#projects" variant="solid" className="w-full sm:w-auto">
              <ScrambleHoverText text="View Systems" />
              <IconArrowRight size={16} />
            </Button>
            <Button href="#contact" variant="outline" className="w-full sm:w-auto">
              <ScrambleHoverText text="Init Contact" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
