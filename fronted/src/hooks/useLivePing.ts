import { useEffect, useRef, useState } from 'react'
import { apiUrl, readEnv } from '@/lib/api'

interface LivePingState {
  latencyMs: number | null
  isOnline: boolean
  checkedAt: number | null
}

const PING_INTERVAL_MS = 5000
const REQUEST_TIMEOUT_MS = 2500
const CUSTOM_PING_URL = readEnv('VITE_LIVE_PING_URL')

function measureLatencyUrl(): string {
  const target = new URL(apiUrl(CUSTOM_PING_URL || '/api/health/'), window.location.origin)
  target.searchParams.set('ping', String(Date.now()))
  return target.toString()
}

export function useLivePing() {
  const [state, setState] = useState<LivePingState>({
    latencyMs: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    checkedAt: null
  })
  const inFlightRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const runPing = async () => {
      if (!isMounted || inFlightRef.current) {
        return
      }

      inFlightRef.current = true
      const startedAt = performance.now()
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      try {
        const response = await fetch(measureLatencyUrl(), {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error(`Ping failed with status ${response.status}`)
        }

        if (!isMounted) {
          return
        }

        setState({
          latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
          isOnline: true,
          checkedAt: Date.now()
        })
      } catch {
        if (!isMounted) {
          return
        }

        setState({
          latencyMs: null,
          isOnline: false,
          checkedAt: Date.now()
        })
      } finally {
        window.clearTimeout(timeoutId)
        inFlightRef.current = false
      }
    }

    const onOnline = () => {
      setState((prev) => ({ ...prev, isOnline: false }))
      void runPing()
    }

    const onOffline = () => {
      setState((prev) => ({ ...prev, latencyMs: null, isOnline: false, checkedAt: Date.now() }))
    }

    void runPing()
    const intervalId = window.setInterval(() => {
      void runPing()
    }, PING_INTERVAL_MS)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return state
}
