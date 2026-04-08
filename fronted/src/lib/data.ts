import type { ContactLink, HeroStat, NavItem, Project, RoadmapStage } from '@/lib/types'

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Projects', href: '#projects' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Skills', href: '#skills' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' }
]

export const HERO_ROLES: readonly string[] = [
  'Backend Developer',
  'Django & DRF Engineer',
  'Telegram Bot Architect',
  'Scalable API Builder'
]

export const HERO_STATS: readonly HeroStat[] = [
  { label: 'SYS', value: 'ONLINE', signal: 'blue' },
  { label: 'UPTIME', value: '99.9%', signal: 'blue' },
  { label: 'LATENCY', value: '42ms' }
]

export const PROJECTS: readonly Project[] = [
  {
    id: 'marketplace-bot',
    title: 'Marketplace Telegram Bot',
    summary: 'OLX-style product marketplace fully operated inside Telegram.',
    description:
      'Designed an async-first marketplace bot with category flows, seller/buyer interactions, moderation queues, and resilient background delivery for high request concurrency.',
    techStack: ['Python', 'Django', 'DRF', 'PostgreSQL', 'Redis', 'Celery'],
    architecture:
      'Layered service architecture with queue-backed workloads. Redis powers hot-path caching and rate-safe task distribution while PostgreSQL handles transactional domain state.',
    apiHint: 'GET /projects/marketplace-bot',
    projectUrl: 'https://github.com/ismatovshaxriyor',
    coverImage: '/static/images/img.png',
    signal: 'blue'
  },
  {
    id: 'movie-download-bot',
    title: 'Movie Download Bot',
    summary: 'High-throughput media bot optimized for quick retrieval and delivery.',
    description:
      'Built a searchable movie delivery backend with metadata indexing, file-id caching, and async queue orchestration to keep response times stable under burst traffic.',
    techStack: ['Python', 'Django', 'Telegram API', 'PostgreSQL', 'Redis'],
    architecture:
      'Read-heavy architecture with indexed search and cache-first routing. Media metadata and lookup keys are partitioned to protect command-response latency.',
    apiHint: 'GET /projects/movie-download-bot',
    projectUrl: 'https://github.com/ismatovshaxriyor',
    coverImage: '/static/images/img_1.png',
    signal: 'red'
  },
  {
    id: 'realtime-chat-api',
    title: 'Real-time Chat API',
    summary: 'WebSocket and REST backend for live messaging systems.',
    description:
      'Implemented channel-based communication, durable message persistence, presence tracking, and read/typing indicators with reliable fan-out between WebSocket workers.',
    techStack: ['Django Channels', 'DRF', 'Redis', 'PostgreSQL', 'Daphne'],
    architecture:
      'Event-driven core with Redis pub/sub as broadcast fabric. HTTP APIs provide durable history while socket workers handle transient realtime state.',
    apiHint: 'GET /projects/realtime-chat-api',
    projectUrl: 'https://github.com/ismatovshaxriyor',
    coverImage: '/static/images/profile.png',
    signal: 'blue'
  },
  {
    id: 'drf-boilerplate',
    title: 'DRF Boilerplate',
    summary: 'Production-focused Django REST baseline for rapid project starts.',
    description:
      'Created a reusable backend foundation with auth, permissions, structured settings, observability defaults, and deployment-ready conventions for teams.',
    techStack: ['Django', 'DRF', 'PostgreSQL', 'Docker', 'GitHub Actions'],
    architecture:
      'Clean module boundaries, explicit service/use-case layers, and environment-driven configuration for consistent behavior from local development to production.',
    apiHint: 'GET /projects/drf-boilerplate',
    projectUrl: 'https://github.com/ismatovshaxriyor',
    coverImage: '/static/images/ismtov.png',
    signal: 'red'
  }
]

export const ROADMAP_STAGES: readonly RoadmapStage[] = [
  {
    id: 'discovery',
    title: 'Problem Discovery',
    window: 'STEP 01',
    summary: 'I start from business pain, user flow, and measurable outcome before any code is written.',
    completion: 100,
    status: 'shipped',
    signal: 'blue',
    deliverables: ['Clarify target users', 'Define success metrics', 'List hard constraints']
  },
  {
    id: 'scope',
    title: 'Scope & Contract',
    window: 'STEP 02',
    summary: 'Then I lock MVP boundaries and API contracts so implementation does not drift under pressure.',
    completion: 100,
    status: 'shipped',
    signal: 'red',
    deliverables: ['Define MVP endpoints', 'Write data contracts', 'Prioritize critical paths']
  },
  {
    id: 'architecture',
    title: 'Architecture Blueprint',
    window: 'STEP 03',
    summary: 'I map modules, queues, and data ownership to keep the backend predictable during growth.',
    completion: 78,
    status: 'building',
    signal: 'blue',
    deliverables: ['Choose storage strategy', 'Plan async workloads', 'Set observability baseline']
  },
  {
    id: 'delivery',
    title: 'MVP Delivery Loop',
    window: 'STEP 04',
    summary: 'Build, validate, and ship fast iterations with tests and monitoring from day one.',
    completion: 42,
    status: 'building',
    signal: 'red',
    deliverables: ['Implement core use-cases', 'Add test coverage', 'Ship first stable release']
  },
  {
    id: 'hardening',
    title: 'Hardening & Scale',
    window: 'STEP 05',
    summary: 'After launch, I focus on bottlenecks, security, and scaling strategy for real traffic.',
    completion: 14,
    status: 'planned',
    signal: 'blue',
    deliverables: ['Tune rate limits', 'Optimize hot endpoints', 'Prepare horizontal scaling']
  }
]

export const ABOUT_TEXT: readonly string[] = [
  'My name is Shaxriyor. I am {{age}}, and I am a junior-level backend developer who can build websites and Telegram bots.',
  'I am currently studying Artificial Intelligence at the National University of Uzbekistan, and I am working hard to take on bigger projects in the future.'
]

export const ABOUT_HIGHLIGHTS: ReadonlyArray<{ title: string; text: string }> = [
  {
    title: 'Education',
    text: 'Faculty of Mathematics, Artificial Intelligence, National University of Uzbekistan (Mirzo Ulugbek).'
  },
  {
    title: 'Mission',
    text: 'Deliver premium backend experiences that are secure, elegant, and reliable.'
  },
  {
    title: 'Passion',
    text: 'Designing systems that empower teams to ship faster with confidence.'
  }
]

export const CONTACTS: readonly Omit<ContactLink, 'icon'>[] = [
  {
    id: 'email',
    label: 'Email',
    value: 'shaxriyorismatov2007@gmail.com',
    href: 'mailto:shaxriyorismatov2007@gmail.com',
    external: false,
    signal: 'blue'
  },
  {
    id: 'telegram',
    label: 'Telegram',
    value: '@ismatov_shaxriyor',
    href: 'https://t.me/ismatov_shaxriyor',
    external: true,
    signal: 'blue'
  },
  {
    id: 'github',
    label: 'GitHub',
    value: 'ismatovshaxriyor',
    href: 'https://github.com/ismatovshaxriyor',
    external: true,
    signal: 'red'
  },
  {
    id: 'instagram',
    label: 'Instagram',
    value: 'ismatov_shaxriyor',
    href: 'https://www.instagram.com/ismatov_shaxriyor/',
    external: true,
    signal: 'red'
  }
]
