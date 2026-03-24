import type { ReactNode } from 'react'

export type SignalColor = 'blue' | 'red'

export interface NavItem {
  label: string
  href: string
}

export interface HeroStat {
  label: string
  value: string
  signal?: SignalColor
}

export interface Project {
  id: string
  title: string
  summary: string
  description: string
  techStack: string[]
  architecture: string
  apiHint: string
  signal: SignalColor
}

export type SkillIconKey = 'api' | 'bot' | 'code' | 'concept' | 'cpu' | 'database' | 'grid' | 'layers' | 'server' | 'tooling'

export interface SkillItem {
  label: string
  icon: ReactNode
}

export interface SkillGroup {
  id: string
  label: string
  items: SkillItem[]
}

export interface SkillLogo {
  name: string
  src: string
}

export interface SkillItemApi {
  label: string
  iconKey: SkillIconKey
}

export interface SkillGroupApi {
  id: string
  title: string
  streamDirection: 'left' | 'right'
  items: SkillItemApi[]
  logos: SkillLogo[]
}

export interface ContactLink {
  id: string
  label: string
  value: string
  href: string
  external: boolean
  icon: ReactNode
  signal: SignalColor
}
