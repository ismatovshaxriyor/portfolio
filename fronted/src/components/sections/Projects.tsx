import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { IconApi, IconArrowUpRight, IconDatabase, IconGrid, IconServer } from '@/components/icons'
import Modal from '@/components/ui/Modal'
import Card from '@/components/ui/Card'
import RainText from '@/components/ui/RainText'
import ScrambleHoverText from '@/components/ui/ScrambleHoverText'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { PROJECTS } from '@/lib/data'
import { cn } from '@/lib/cn'
import { apiUrl } from '@/lib/api'
import type { Project } from '@/lib/types'

const CARD_STACK_PREVIEW_COUNT = 3

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeProject(entry: unknown): Project | null {
  if (!isObject(entry)) {
    return null
  }

  const id = typeof entry.id === 'string' ? entry.id.trim() : ''
  const title = typeof entry.title === 'string' ? entry.title.trim() : ''
  const summary = typeof entry.summary === 'string' ? entry.summary.trim() : ''
  const description = typeof entry.description === 'string' ? entry.description.trim() : ''
  const architecture = typeof entry.architecture === 'string' ? entry.architecture.trim() : ''
  const apiHint = typeof entry.apiHint === 'string' ? entry.apiHint.trim() : ''
  const signal = entry.signal === 'red' ? 'red' : entry.signal === 'blue' ? 'blue' : null
  const rawTechStack =
    Array.isArray(entry.techStack) && entry.techStack.every((tech) => typeof tech === 'string')
      ? entry.techStack
      : []
  const techStack = Array.from(new Set(rawTechStack.map((tech) => tech.trim()).filter(Boolean)))

  if (!id || !title || !summary || !description || !architecture || !apiHint || !signal || techStack.length === 0) {
    return null
  }

  return {
    id,
    title,
    summary,
    description,
    architecture,
    apiHint,
    signal,
    techStack
  }
}

export default function Projects() {
  const [sectionRef, visible] = useIntersectionObserver<HTMLElement>({ threshold: 0.18 })
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>(() => [...PROJECTS])

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects]
  )

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        const response = await fetch(apiUrl('/api/projects/'), {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal
        })
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { results?: unknown }
        if (!Array.isArray(payload.results)) {
          return
        }

        const normalized = payload.results
          .map((entry) => normalizeProject(entry))
          .filter((entry): entry is Project => Boolean(entry))

        if (normalized.length > 0) {
          setProjects(normalized)
        }
      } catch {
        // Keep static fallback when API is unavailable.
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  const closeModal = useCallback(() => setActiveProjectId(null), [])

  const handleCardMouseMove = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    const rotateY = (x - 50) / 14
    const rotateX = (50 - y) / 16

    element.style.setProperty('--mx', `${x}%`)
    element.style.setProperty('--my', `${y}%`)
    element.classList.add('project-card-pointer-active')
    element.style.transform = `translateY(-4px) scale(1.01) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }, [])

  const handleCardMouseLeave = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    element.classList.remove('project-card-pointer-active')
    element.style.transform = ''
  }, [])

  const handleCardBlur = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove('project-card-pointer-active')
  }, [])

  return (
    <section id="projects" ref={sectionRef} className="site-shell section-border py-20">
      <div className={cn('section-reveal', visible && 'section-reveal-visible')}>
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/45">
              <ScrambleHoverText text="/* 01. PROJECTS */" />
            </p>
            <div className="h-px w-20 bg-white/25" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-signal-red/68">
            <ScrambleHoverText text={`[ STATUS: ${projects.length} MODULES ONLINE ]`} />
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {projects.map((project, index) => {
            const signalClass =
              project.signal === 'blue' ? 'project-card-blue group-hover:border-signal-blue/50 group-hover:shadow-signal-blue' : 'project-card-red group-hover:border-signal-red/50 group-hover:shadow-signal-red'
            const stageStyle: CSSProperties = {
              transitionDelay: `${index * 90}ms`
            }

            return (
              <div key={project.id} className={cn('project-card-stage', visible && 'project-card-stage-visible')} style={stageStyle}>
                <Card
                  onSelect={() => setActiveProjectId(project.id)}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  onBlur={handleCardBlur}
                  ariaLabel={`Open project details for ${project.title}`}
                  className={cn('project-card group relative flex h-full flex-col overflow-hidden border-white/15 p-6 transition-all duration-300 ease-system-ease', signalClass)}
                >
                  <div aria-hidden="true" className="project-corners">
                    <span className="project-corner project-corner-tl" />
                    <span className="project-corner project-corner-tr" />
                    <span className="project-corner project-corner-bl" />
                    <span className="project-corner project-corner-br" />
                  </div>

                  <div
                    className={cn(
                      'pointer-events-none absolute right-4 top-4 max-w-[62%] truncate text-right text-[9px] tracking-[0.14em] opacity-0 transition-all duration-300 ease-system-ease group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:opacity-100',
                      project.signal === 'red' ? 'text-signal-red/48' : 'text-white/28'
                    )}
                  >
                    <ScrambleHoverText text={project.apiHint} playOnMount={false} />
                  </div>

                  <div className="pointer-events-none absolute left-0 top-0 h-[1px] w-full overflow-hidden">
                    <span className="project-card-scanline" />
                  </div>

                  <div className="mb-5 inline-flex h-8 w-8 items-center justify-center border border-white/20 text-white/65 transition-all duration-300 group-hover:border-white/45 group-hover:text-white">
                    <IconServer size={16} />
                  </div>

                  <RainText
                    as="h3"
                    text={project.title}
                    play={visible}
                    className="font-space text-xl font-medium text-white transition-transform duration-300 group-hover:translate-x-0.5"
                    durationMs={700}
                    staggerMs={18}
                    startY={-54}
                    bounceY={8}
                  />
                  <p className="mt-3 text-sm leading-relaxed text-white/60">{project.summary}</p>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.slice(0, CARD_STACK_PREVIEW_COUNT).map((tech) => (
                        <span key={tech} className="border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-white/45 transition-colors duration-300 group-hover:text-white/65">
                          <ScrambleHoverText text={tech} playOnMount={false} />
                        </span>
                      ))}
                      {project.techStack.length > CARD_STACK_PREVIEW_COUNT ? (
                        <span className="border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-white/38 transition-colors duration-300 group-hover:text-white/62">
                          +{project.techStack.length - CARD_STACK_PREVIEW_COUNT} more
                        </span>
                      ) : null}
                    </div>

                    <span className="inline-flex h-8 w-8 items-center justify-center border border-white/20 text-white/70 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-white group-hover:text-white">
                      <IconArrowUpRight size={14} />
                    </span>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      <Modal isOpen={Boolean(activeProject)} title={activeProject ? `PROJECT ${activeProject.id.toUpperCase()}` : ''} onClose={closeModal}>
        {activeProject ? (
          <article className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:gap-7">
            <div className="space-y-6">
              <div>
                <RainText
                  as="h3"
                  text={activeProject.title}
                  className="text-2xl font-medium text-white"
                  durationMs={760}
                  staggerMs={22}
                  startY={-62}
                  bounceY={10}
                />
                <p className="mt-2 text-sm leading-relaxed text-white/65">{activeProject.description}</p>
              </div>

              <section>
                <h4 className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/55">
                  <IconApi size={14} /> <ScrambleHoverText text="Overview" playOnMount={false} />
                </h4>
                <p className="text-sm leading-relaxed text-white/75">{activeProject.summary}</p>
              </section>

              <section>
                <h4 className="mb-3 text-xs uppercase tracking-[0.2em] text-white/55">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {activeProject.techStack.map((tech) => (
                    <span key={tech} className="border border-white/15 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/70">
                      <ScrambleHoverText text={tech} playOnMount={false} />
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <div className="relative flex aspect-[16/10] items-center justify-center border border-white/10 bg-[#050505]">
                <div className="scanline-overlay" aria-hidden="true" />
                <div className="relative z-10 flex items-center gap-2 text-white/35">
                  <IconGrid size={22} />
                  <span className="text-xs uppercase tracking-[0.22em]">ARCHITECTURE_PLACEHOLDER</span>
                </div>
              </div>

              <section>
                <h4 className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/55">
                  <IconDatabase size={14} /> <ScrambleHoverText text="Architecture" playOnMount={false} />
                </h4>
                <p className="border border-white/10 bg-white/[0.02] p-3 text-sm leading-relaxed text-white/75">{activeProject.architecture}</p>
              </section>
            </div>
          </article>
        ) : null}
      </Modal>
    </section>
  )
}
