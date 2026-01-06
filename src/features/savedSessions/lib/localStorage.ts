export interface SessionData {
  code: string
  gaps: unknown[]
  answers: Record<string, string>
}

const SESSION_KEY = 'codeGapperSessions'

export function saveSession(name: string, data: SessionData) {
  const sessions = loadAllSessions()
  sessions[name] = data
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessions))
}

export function loadSession(name: string): SessionData | null {
  const sessions = loadAllSessions()
  return sessions[name] || null
}

export function loadAllSessions(): Record<string, SessionData> {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function deleteSession(name: string) {
  const sessions = loadAllSessions()
  delete sessions[name]
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessions))
} 