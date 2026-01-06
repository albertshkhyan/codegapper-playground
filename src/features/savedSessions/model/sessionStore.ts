import { create } from 'zustand'
import type { SessionData } from '../lib/localStorage'
import { saveSession, loadSession, loadAllSessions, deleteSession } from '../lib/localStorage'

interface SessionState {
  sessionName: string
  setSessionName: (name: string) => void
  save: (name: string, data: SessionData) => void
  load: (name: string) => SessionData | null
  delete: (name: string) => void
  allSessions: () => Record<string, SessionData>
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionName: '',
  setSessionName: (name) => set({ sessionName: name }),
  save: saveSession,
  load: loadSession,
  delete: deleteSession,
  allSessions: loadAllSessions,
})) 