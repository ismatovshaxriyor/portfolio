import { NAV_ITEMS } from '@/lib/data'
import { IconTerminal } from '@/components/icons'
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
