import { NAV_ITEMS } from '@/lib/data'
import { IconArrowUpRight, IconTerminal } from '@/components/icons'
import ScrambleHoverText from '@/components/ui/ScrambleHoverText'

export default function Navbar() {
  return (
    <header className="fixed top-0 z-40 w-full border-b border-white/10 bg-black/85 backdrop-blur-md">
      <div className="site-shell flex flex-col">
        <div className="flex h-14 items-center justify-between sm:h-16">
          <a
            href="#top"
            className="inline-flex max-w-[72vw] items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/75 transition-colors hover:text-white sm:max-w-none sm:gap-2 sm:text-[11px] sm:tracking-[0.2em]"
          >
            <img
              src="/images/logo-transparent.png"
              alt="Shaxriyor Ismatov logo"
              width={22}
              height={22}
              loading="eager"
              className="h-[20px] w-[20px] object-contain sm:h-[22px] sm:w-[22px]"
            />
            <IconTerminal size={14} className="shrink-0 text-signal-blue" />
            <span className="truncate">~/ismatov/portfolio</span>
            <span className="cursor-blink text-white">_</span>
          </a>

          <div className="flex items-center gap-7">
            <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-[11px] uppercase tracking-[0.22em] text-white/60 transition-colors duration-300 hover:text-signal-blue"
                >
                  <ScrambleHoverText text={item.label} />
                </a>
              ))}
            </nav>

            {/* The 3D rewrite runs as a public beta; its feedback form posts to this backend. */}
            <a
              href="https://beta.ismatov.uz"
              target="_blank"
              rel="noopener"
              title="A 3D version of this portfolio is in beta. Try it and tell me what you think."
              className="inline-flex shrink-0 items-center gap-1.5 border border-signal-blue/50 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-signal-blue transition-colors duration-300 hover:border-signal-blue hover:bg-signal-blue/10 sm:gap-2 sm:px-2.5 sm:text-[10px] sm:tracking-[0.2em]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-signal-blue motion-safe:animate-pulse" aria-hidden="true" />
              <span className="hidden sm:inline">Try the 3D beta</span>
              <span className="sm:hidden">3D beta</span>
              <IconArrowUpRight size={12} />
            </a>
          </div>
        </div>

        <nav aria-label="Primary Mobile" className="mb-2 flex items-center gap-4 overflow-x-auto pb-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-[10px] uppercase tracking-[0.16em] text-white/60 transition-colors duration-300 hover:text-signal-blue"
            >
              <ScrambleHoverText text={item.label} />
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
