const ENV = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env

const API_BASE_URL = ENV?.VITE_API_BASE_URL?.trim() ?? ''

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE_URL) {
    return normalized
  }

  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`
  return new URL(normalized.replace(/^\//, ''), base).toString()
}

export function readEnv(name: string): string {
  return ENV?.[name]?.trim() ?? ''
}
