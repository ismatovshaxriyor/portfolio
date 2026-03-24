export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="site-shell flex flex-col gap-3 py-6 text-[11px] uppercase tracking-[0.2em] text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Shaxriyor Ismatov</p>
        <p className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-signal-blue" />
          <span>[ SYS: ONLINE ]</span>
        </p>
      </div>
    </footer>
  )
}
