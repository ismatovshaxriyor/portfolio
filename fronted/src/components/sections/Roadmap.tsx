import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { IconArrowRight, IconCpu, IconDatabase, IconServer } from '@/components/icons'
import ScrambleHoverText from '@/components/ui/ScrambleHoverText'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { ROADMAP_STAGES } from '@/lib/data'
import type { RoadmapStage } from '@/lib/types'
import { cn } from '@/lib/cn'

function statusLabel(status: RoadmapStage['status']): string {
  if (status === 'building') {
    return 'BUILDING'
  }
  if (status === 'shipped') {
    return 'SHIPPED'
  }
  return 'PLANNED'
}

function statusIcon(status: RoadmapStage['status']) {
  if (status === 'building') {
    return <IconCpu size={14} />
  }
  if (status === 'shipped') {
    return <IconDatabase size={14} />
  }
  return <IconServer size={14} />
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, Math.min(100, Math.round(value)))
}

interface NodePoint {
  x: number
  y: number
}

const CORE_POINT: NodePoint = { x: 50, y: 44 }

const PRESET_NODE_POINTS: readonly NodePoint[] = [
  { x: 18, y: 22 },
  { x: 30, y: 47 },
  { x: 70, y: 47 },
  { x: 82, y: 24 },
  { x: 50, y: 12 },
  { x: 50, y: 84 }
]

function nodePoint(index: number, count: number): NodePoint {
  const preset = PRESET_NODE_POINTS[index]
  if (preset) {
    return preset
  }

  const angle = (Math.PI * 2 * index) / Math.max(1, count)
  const radius = 33
  return {
    x: 50 + Math.cos(angle - Math.PI / 2) * radius,
    y: 46 + Math.sin(angle - Math.PI / 2) * radius
  }
}

export default function Roadmap() {
  const [sectionRef, visible] = useIntersectionObserver<HTMLElement>({ threshold: 0.16 })
  const [activeId, setActiveId] = useState<string>(ROADMAP_STAGES[0]?.id ?? '')
  const [coreHovered, setCoreHovered] = useState(false)

  const stageById = useMemo(() => new Map(ROADMAP_STAGES.map((stage) => [stage.id, stage])), [])
  const activeStage = stageById.get(activeId) ?? ROADMAP_STAGES[0]
  const activeIndex = Math.max(
    0,
    ROADMAP_STAGES.findIndex((stage) => stage.id === activeStage.id)
  )

  return (
    <section id="roadmap" ref={sectionRef} className="site-shell section-border py-16 sm:py-20">
      <div className={cn('section-reveal', visible && 'section-reveal-visible')}>
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/45">
              <ScrambleHoverText text="/* 02. ROADMAP */" />
            </p>
            <div className="h-px w-20 bg-white/25" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 sm:text-[11px] sm:tracking-[0.2em]">
            <ScrambleHoverText text={`[ PROTOCOL: ${ROADMAP_STAGES.length} STARTUP STEPS ]`} playOnMount={false} />
          </p>
        </header>

        <div className="roadmap-shell border border-white/10 bg-[#040404] p-4 sm:p-5">
          <div className="roadmap-grid-overlay" aria-hidden="true" />
          <div className={cn('roadmap-graph-stage', visible && 'roadmap-graph-stage-visible')}>
            <div className="relative hidden h-[620px] lg:block">
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="roadmap-graph-lines pointer-events-none absolute inset-0 h-full w-full"
              >
                {ROADMAP_STAGES.map((stage, index) => {
                  const from = nodePoint(index, ROADMAP_STAGES.length)
                  const nextIndex = (index + 1) % ROADMAP_STAGES.length
                  const to = nodePoint(nextIndex, ROADMAP_STAGES.length)
                  const isActiveLink = index <= activeIndex
                  return (
                    <line
                      key={`${stage.id}-seq`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      className={cn('roadmap-link', isActiveLink && 'roadmap-link-active')}
                    />
                  )
                })}

                {ROADMAP_STAGES.map((stage, index) => {
                  const point = nodePoint(index, ROADMAP_STAGES.length)
                  const isActiveCore = stage.id === activeStage.id
                  const isConnected = coreHovered || isActiveCore
                  return (
                    <line
                      key={`${stage.id}-core`}
                      x1={CORE_POINT.x}
                      y1={CORE_POINT.y}
                      x2={point.x}
                      y2={point.y}
                      className={cn(
                        'roadmap-link roadmap-link-core',
                        isConnected && 'roadmap-link-core-active',
                        stage.signal === 'red' ? 'roadmap-link-red' : 'roadmap-link-blue'
                      )}
                    />
                  )
                })}
              </svg>

              <div
                className={cn(
                  'roadmap-core-node',
                  activeStage.signal === 'red' ? 'roadmap-core-node-red' : 'roadmap-core-node-blue',
                  coreHovered && 'roadmap-core-node-linking'
                )}
                style={{ left: `${CORE_POINT.x}%`, top: `${CORE_POINT.y}%` }}
                onMouseEnter={() => setCoreHovered(true)}
                onMouseLeave={() => setCoreHovered(false)}
                onFocus={() => setCoreHovered(true)}
                onBlur={() => setCoreHovered(false)}
                tabIndex={0}
              >
                <span className={cn('roadmap-core-led', activeStage.signal === 'red' ? 'roadmap-core-led-red' : 'roadmap-core-led-blue')} />
                <p className="text-[9px] uppercase tracking-[0.16em] text-white/52">Core</p>
                <p className="mt-1 text-sm font-medium text-white">START PROTOCOL</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/45">Active: {activeStage.window}</p>
                <div className="roadmap-core-progress">
                  <span
                    className={cn(
                      'roadmap-core-progress-fill',
                      activeStage.signal === 'red' ? 'roadmap-core-progress-fill-red' : 'roadmap-core-progress-fill-blue'
                    )}
                    style={{ width: `${clampProgress(activeStage.completion)}%` }}
                  />
                </div>
              </div>

              {ROADMAP_STAGES.map((stage, index) => {
                const progress = clampProgress(stage.completion)
                const point = nodePoint(index, ROADMAP_STAGES.length)
                const style: CSSProperties = {
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  animationDelay: `${index * 0.22}s`
                }
                const isActive = stage.id === activeStage.id
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onMouseEnter={() => setActiveId(stage.id)}
                    onFocus={() => setActiveId(stage.id)}
                    onClick={() => setActiveId(stage.id)}
                    style={style}
                    className={cn(
                      'roadmap-node',
                      stage.signal === 'red' ? 'roadmap-node-red' : 'roadmap-node-blue',
                      stage.status === 'building' && 'roadmap-node-building',
                      isActive && 'roadmap-node-active'
                    )}
                  >
                    <p className="text-[9px] uppercase tracking-[0.15em] text-white/46">{stage.window}</p>
                    <p className="mt-1 text-sm font-medium text-white">{stage.title}</p>
                    <p className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-white/44">{progress}% complete</p>
                  </button>
                )
              })}

              <article className="roadmap-focus-panel">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/42">
                    <ScrambleHoverText text={`ACTIVE · ${activeStage.window}`} playOnMount={false} />
                  </p>
                  <span
                    className={cn(
                      'roadmap-status-pill inline-flex items-center gap-1 border px-2 py-1 text-[10px] uppercase tracking-[0.16em]',
                      activeStage.signal === 'blue'
                        ? 'border-signal-blue/45 text-signal-blue/90'
                        : 'border-signal-red/45 text-signal-red/90'
                    )}
                  >
                    {statusIcon(activeStage.status)}
                    {statusLabel(activeStage.status)}
                  </span>
                </div>

                <h3 className="text-xl font-medium text-white">{activeStage.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/68">{activeStage.summary}</p>

                <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                  {activeStage.deliverables.map((deliverable) => (
                    <li key={deliverable} className="flex items-start gap-2 border border-white/10 bg-black/45 px-2.5 py-2 text-[12px] text-white/64">
                      <span className={cn('mt-0.5', activeStage.signal === 'blue' ? 'text-signal-blue/82' : 'text-signal-red/82')}>
                        <IconArrowRight size={12} />
                      </span>
                      <span>{deliverable}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 border-t border-white/10 pt-3">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-white/45">
                    <span>Completion</span>
                    <span>{clampProgress(activeStage.completion)}%</span>
                  </div>
                  <div className="roadmap-progress">
                    <span
                      className={cn(
                        'roadmap-progress-fill',
                        activeStage.signal === 'blue' ? 'roadmap-progress-fill-blue' : 'roadmap-progress-fill-red'
                      )}
                      style={{ width: `${clampProgress(activeStage.completion)}%` }}
                    />
                  </div>
                </div>
              </article>
            </div>

            <div className="grid gap-3 lg:hidden">
              {ROADMAP_STAGES.map((stage, index) => {
                const progress = clampProgress(stage.completion)
                const itemStyle: CSSProperties = { transitionDelay: `${index * 90}ms` }
                const isActive = stage.id === activeStage.id
                return (
                  <button
                    key={stage.id}
                    type="button"
                    style={itemStyle}
                    onClick={() => setActiveId(stage.id)}
                    className={cn(
                      'roadmap-card roadmap-card-stage relative overflow-hidden border border-white/12 bg-[#050505] p-4 text-left',
                      stage.signal === 'blue' ? 'roadmap-card-blue' : 'roadmap-card-red',
                      isActive && 'roadmap-card-active-mobile',
                      visible && 'roadmap-card-stage-visible'
                    )}
                  >
                    <span aria-hidden="true" className="roadmap-card-scanline" />
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/42">{stage.window}</p>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-white/50">{progress}%</span>
                    </div>
                    <p className="text-base font-medium text-white">{stage.title}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
