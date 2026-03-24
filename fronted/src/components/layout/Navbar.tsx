import { NAV_ITEMS } from '@/lib/data'
import { IconTerminal } from '@/components/icons'
import ScrambleHoverText from '@/components/ui/ScrambleHoverText'

export default function Navbar() {
  return (
    <header className="fixed top-0 z-40 w-full border-b border-white/10 bg-black/85 backdrop-blur-md">
      <div className="site-shell flex flex-col">
        <div className="flex h-16 items-center justify-between">
        <a href="#top" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/75 transition-colors hover:text-white">
          <img
            src="/images/logo-transparent.png"
            alt="Shaxriyor Ismatov logo"
            width={22}
            height={22}
            loading="eager"
            className="h-[22px] w-[22px] object-contain"
          />
          <IconTerminal size={14} className="text-signal-blue" />
          <span>~/ismatov/portfolio</span>
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
              className="whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-white/60 transition-colors duration-300 hover:text-signal-blue"
            >
              <ScrambleHoverText text={item.label} />
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
