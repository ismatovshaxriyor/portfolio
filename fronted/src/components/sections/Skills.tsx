import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  IconApi,
  IconBot,
  IconCode,
  IconConcept,
  IconCpu,
  IconDatabase,
  IconGrid,
  IconLayers,
  IconServer,
  IconTooling
} from '@/components/icons'
import ScrambleHoverText from '@/components/ui/ScrambleHoverText'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { cn } from '@/lib/cn'
import { apiUrl } from '@/lib/api'
import type { SkillGroupApi, SkillIconKey, SkillItemApi, SkillLogo } from '@/lib/types'

interface SkillGroupView {
  id: string
  title: string
  items: Array<{ label: string; icon: ReactNode }>
  stackLogos: SkillLogo[]
  streamDirection: 'left' | 'right'
}

const SKILL_LOGOS: readonly SkillLogo[] = [
  { name: 'Python', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { name: 'Django', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg' },
  { name: 'FastAPI', src: 'https://cdn.simpleicons.org/fastapi/009688' },
  { name: 'PyCharm', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pycharm/pycharm-original.svg' },
  { name: 'VS Code', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
  { name: 'PostgreSQL', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'SQLite', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg' },
  { name: 'MySQL', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
  { name: 'Redis', src: 'https://cdn.simpleicons.org/redis/DC382D' },
  { name: 'TortoiseGit', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tortoisegit/tortoisegit-original.svg' },
  { name: 'Git', src: 'https://cdn.simpleicons.org/git/F05032' },
  { name: 'GitHub', src: 'https://skillicons.dev/icons?i=github' },
  { name: 'GitHub Actions', src: 'https://skillicons.dev/icons?i=githubactions' },
  { name: 'HTML5', src: 'https://skillicons.dev/icons?i=html' },
  { name: 'CSS3', src: 'https://skillicons.dev/icons?i=css' },
  { name: 'JavaScript', src: 'https://skillicons.dev/icons?i=js' },
  { name: 'Linux', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg' },
  { name: 'Bash', src: 'https://cdn.simpleicons.org/gnubash/4EAA25' },
  { name: 'AWS', src: 'https://skillicons.dev/icons?i=aws' },
  { name: 'GCP', src: 'https://skillicons.dev/icons?i=gcp' },
  { name: 'Nginx', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg' },
  { name: 'Docker', src: 'https://cdn.simpleicons.org/docker/2496ED' },
  { name: 'RabbitMQ', src: 'https://cdn.simpleicons.org/rabbitmq/FF6600' },
  { name: 'Pytest', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytest/pytest-original.svg' },
  { name: 'Postman', src: 'https://skillicons.dev/icons?i=postman' }
]

const LOGO_BY_NAME = new Map(SKILL_LOGOS.map((logo) => [logo.name, logo]))
const ICON_KEYS: readonly SkillIconKey[] = ['api', 'bot', 'code', 'concept', 'cpu', 'database', 'grid', 'layers', 'server', 'tooling']

function pickSkillLogos(names: readonly string[]): SkillLogo[] {
  return names.map((name) => LOGO_BY_NAME.get(name)).filter((logo): logo is SkillLogo => Boolean(logo))
}

const FALLBACK_GROUPS: readonly SkillGroupApi[] = [
  {
    id: 'backend',
    title: 'Backend',
    streamDirection: 'left',
    items: [
      { label: 'Python', iconKey: 'code' },
      { label: 'Django / DRF', iconKey: 'layers' },
      { label: 'PostgreSQL', iconKey: 'database' },
      { label: 'Redis', iconKey: 'grid' }
    ],
    logos: pickSkillLogos(['Python', 'Django', 'FastAPI', 'PostgreSQL', 'SQLite', 'MySQL', 'Redis', 'Pytest'])
  },
  {
    id: 'tools',
    title: 'Tools',
    streamDirection: 'right',
    items: [
      { label: 'Docker', iconKey: 'tooling' },
      { label: 'Celery', iconKey: 'server' },
      { label: 'Git / CI', iconKey: 'cpu' },
      { label: 'Linux', iconKey: 'tooling' }
    ],
    logos: pickSkillLogos(['Docker', 'RabbitMQ', 'Git', 'GitHub', 'GitHub Actions', 'Nginx', 'Postman', 'VS Code'])
  },
  {
    id: 'concepts',
    title: 'Concepts',
    streamDirection: 'left',
    items: [
      { label: 'API Design', iconKey: 'api' },
      { label: 'Scalability', iconKey: 'concept' },
      { label: 'Async Systems', iconKey: 'bot' },
      { label: 'Realtime Comms', iconKey: 'server' }
    ],
    logos: pickSkillLogos(['Linux', 'Bash', 'AWS', 'GCP', 'JavaScript', 'HTML5', 'CSS3', 'PyCharm'])
  }
]

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isIconKey(value: unknown): value is SkillIconKey {
  return typeof value === 'string' && ICON_KEYS.includes(value as SkillIconKey)
}

function normalizeItem(value: unknown): SkillItemApi | null {
  if (!isObject(value)) {
    return null
  }
  const label = typeof value.label === 'string' ? value.label.trim() : ''
  const iconKey = value.iconKey
  if (!label || !isIconKey(iconKey)) {
    return null
  }
  return { label, iconKey }
}

function normalizeLogo(value: unknown): SkillLogo | null {
  if (!isObject(value)) {
    return null
  }
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const src = typeof value.src === 'string' ? value.src.trim() : ''
  if (!name || !src) {
    return null
  }
  return { name, src }
}

function normalizeGroup(value: unknown): SkillGroupApi | null {
  if (!isObject(value)) {
    return null
  }
  const id = typeof value.id === 'string' ? value.id.trim() : ''
  const title = typeof value.title === 'string' ? value.title.trim() : ''
  const streamDirection = value.streamDirection === 'right' ? 'right' : 'left'
  const itemsRaw = Array.isArray(value.items) ? value.items : []
  const logosRaw = Array.isArray(value.logos) ? value.logos : []
  const items = itemsRaw.map(normalizeItem).filter((item): item is SkillItemApi => Boolean(item))
  const logos = logosRaw.map(normalizeLogo).filter((logo): logo is SkillLogo => Boolean(logo))

  if (!id || !title || items.length === 0 || logos.length === 0) {
    return null
  }
  return { id, title, streamDirection, items, logos }
}

function iconByKey(iconKey: SkillIconKey): ReactNode {
  if (iconKey === 'api') {
    return <IconApi size={16} />
  }
  if (iconKey === 'bot') {
    return <IconBot size={16} />
  }
  if (iconKey === 'code') {
    return <IconCode size={16} />
  }
  if (iconKey === 'concept') {
    return <IconConcept size={16} />
  }
  if (iconKey === 'cpu') {
    return <IconCpu size={16} />
  }
  if (iconKey === 'database') {
    return <IconDatabase size={16} />
  }
  if (iconKey === 'grid') {
    return <IconGrid size={16} />
  }
  if (iconKey === 'layers') {
    return <IconLayers size={16} />
  }
  if (iconKey === 'server') {
    return <IconServer size={16} />
  }
  return <IconTooling size={16} />
}

export default function Skills() {
  const [sectionRef, visible] = useIntersectionObserver<HTMLElement>({ threshold: 0.16 })
  const [groupsApi, setGroupsApi] = useState<SkillGroupApi[]>(() => [...FALLBACK_GROUPS])

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        const response = await fetch(apiUrl('/api/skills/'), {
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
          .map((entry) => normalizeGroup(entry))
          .filter((group): group is SkillGroupApi => Boolean(group))

        if (normalized.length > 0) {
          setGroupsApi(normalized)
        }
      } catch {
        // Keep fallback data when API is unavailable.
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  const groups = useMemo<SkillGroupView[]>(
    () =>
      groupsApi.map((group) => ({
        id: group.id,
        title: group.title,
        streamDirection: group.streamDirection,
        stackLogos: group.logos,
        items: group.items.map((item) => ({ label: item.label, icon: iconByKey(item.iconKey) }))
      })),
    [groupsApi]
  )

  return (
    <section id="skills" ref={sectionRef} className="site-shell section-border py-20">
      <div className={cn('section-reveal', visible && 'section-reveal-visible')}>
        <header className="mb-10">
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/45">
            <ScrambleHoverText text="/* 02. SKILLS */" />
          </p>
          <div className="h-px w-20 bg-white/25" />
        </header>

        <section className="border border-white/10 bg-[#040404] p-4 sm:p-5">
          <div className="relative">
            <div className="skills-connector pointer-events-none absolute left-[16.66%] right-[16.66%] top-6 hidden h-px bg-white/10 md:block" />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {groups.map((group, groupIndex) => {
                const stageStyle: CSSProperties = {
                  transitionDelay: `${groupIndex * 90}ms`
                }

                return (
                  <article
                    key={group.id}
                    style={stageStyle}
                    className={cn(
                      'skill-panel skill-panel-stage relative overflow-hidden border border-white/12 bg-[#050505] p-5',
                      visible && 'skill-panel-stage-visible'
                    )}
                  >
                    <span aria-hidden="true" className="skill-panel-scanline" />

                    <div className="mb-4 flex items-center gap-2">
                      <span className="skill-panel-led inline-block h-2 w-2 bg-white/55" />
                      <h3 className="text-xs uppercase tracking-[0.24em] text-white/70">
                        <ScrambleHoverText text={group.title} />
                      </h3>
                    </div>

                    <ul className="space-y-2.5" aria-label={`${group.title} skills`}>
                      {group.items.map((item, itemIndex) => {
                        const itemStyle: CSSProperties = {
                          transitionDelay: `${groupIndex * 90 + itemIndex * 70 + 80}ms`
                        }

                        return (
                          <li
                            key={item.label}
                            style={itemStyle}
                            className={cn(
                              'skill-item flex items-center gap-3 border border-transparent px-2 py-1.5 text-sm text-white/70 transition-colors duration-300 hover:border-white/10 hover:text-white',
                              visible && 'skill-item-visible'
                            )}
                          >
                            <span className="skill-item-icon text-white/45">{item.icon}</span>
                            <span>{item.label}</span>
                          </li>
                        )
                      })}
                    </ul>

                    <div className="skill-stack-wrap">
                      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/42">
                        <ScrambleHoverText text="[ STACK FLOW ]" playOnMount={false} />
                      </p>

                      <div className="skill-marquee-mask">
                        <div
                          className={cn(
                            'skill-marquee-track',
                            group.streamDirection === 'right' && 'skill-marquee-track-right'
                          )}
                        >
                          {[...group.stackLogos, ...group.stackLogos].map((logo, logoIndex) => (
                            <span
                              key={`${group.id}-${logo.name}-${logoIndex}`}
                              style={{ animationDelay: `${(logoIndex % 10) * 0.16}s` }}
                              className="skill-logo-pill"
                              title={logo.name}
                              aria-label={logo.name}
                            >
                              <img
                                src={logo.src}
                                alt={`${logo.name} logo`}
                                width={20}
                                height={20}
                                loading="lazy"
                                decoding="async"
                                className="skill-logo-pill-img"
                              />
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}
