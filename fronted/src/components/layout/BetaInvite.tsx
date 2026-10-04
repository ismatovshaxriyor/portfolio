import { useEffect, useState } from 'react'
import { IconArrowUpRight, IconClose } from '@/components/icons'

const BETA_URL = 'https://beta.ismatov.uz'
const DISMISSED_KEY = 'portfolio:beta-invite-dismissed'
// The card slides in once the hero has settled, not on top of the reveal.
const SHOW_DELAY_MS = 2500

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

// Asks visitors to try the 3D beta and leave feedback there (its form posts to
// this site's backend). Closing it, or following it, is remembered; the
// navbar's "Try the 3D beta" link stays either way.
export default function BetaInvite() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (wasDismissed()) {
      return
    }
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      window.localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // Storage blocked: the card comes back on the next visit.
    }
  }

  if (!visible) {
    return null
  }

  return (
    <aside
      aria-labelledby="beta-invite-title"
      className="beta-invite fixed inset-x-3 bottom-3 z-30 border border-signal-blue/40 bg-[#060606]/95 p-4 shadow-signal-blue backdrop-blur-md sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[22rem] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p id="beta-invite-title" className="text-[10px] uppercase tracking-[0.24em] text-signal-blue">
          <span aria-hidden="true">/* </span>Beta test<span aria-hidden="true"> */</span>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="-m-1 p-1 text-white/45 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <IconClose size={16} />
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-white/80">
        A new 3D version of this portfolio is in testing. Have a look and leave feedback there — it takes under a
        minute.
      </p>
      <div className="mt-4 flex items-center gap-5">
        <a
          href={BETA_URL}
          target="_blank"
          rel="noopener"
          onClick={dismiss}
          className="inline-flex items-center gap-2 border border-white bg-white px-3.5 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-black transition-colors duration-300 hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Try the beta
          <IconArrowUpRight size={12} />
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="text-[10px] uppercase tracking-[0.2em] text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Not now
        </button>
      </div>
    </aside>
  )
}
