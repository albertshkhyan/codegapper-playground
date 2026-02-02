import { create } from 'zustand';
import { sessionStorage, type SessionData } from '../utils/sessionStorage';
import { defaultGapSettings } from '../shared/lib/gapEngine/settings';

interface SessionStore {
  currentSessionId: string | null;
  sessions: SessionData[];
  
  // Actions
  loadSessions: () => void;
  createSession: (name: string, groupName?: string) => string;
  saveCurrentSession: (sessionData: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt' | 'name'>) => string | null;
  loadSession: (id: string) => SessionData | null;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newName: string, groupName?: string) => boolean;
  setCurrentSessionId: (id: string | null) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSessionId: null,
  sessions: [],

  loadSessions: () => {
    const sessions = sessionStorage.getAll();
    set({ sessions });
  },

  createSession: (name: string, groupName?: string) => {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newSession: SessionData = {
      id,
      name,
      groupName,
      createdAt: now,
      updatedAt: now,
      inputCode: '',
      segments: [],
      answerKey: {},
      userAnswers: {},
      gapSettings: defaultGapSettings,
    };
    
    sessionStorage.save(newSession);
    get().loadSessions();
    set({ currentSessionId: id });
    
    return id;
  },

  saveCurrentSession: (sessionData) => {
    const { currentSessionId } = get();
    
    if (!currentSessionId) {
      return null;
    }
    
    const existingSession = sessionStorage.get(currentSessionId);
    if (!existingSession) {
      return null;
    }
    
    const updatedSession: SessionData = {
      ...existingSession,
      ...sessionData,
      updatedAt: new Date().toISOString(),
    };
    
    sessionStorage.save(updatedSession);
    get().loadSessions();
    
    return currentSessionId;
  },

  loadSession: (id: string) => {
    const session = sessionStorage.get(id);
    if (session) {
      set({ currentSessionId: id });
    }
    return session;
  },

  deleteSession: (id: string) => {
    sessionStorage.delete(id);
    const { currentSessionId } = get();
    if (currentSessionId === id) {
      set({ currentSessionId: null });
    }
    get().loadSessions();
  },

  renameSession: (id: string, newName: string, groupName?: string) => {
    const session = sessionStorage.get(id);
    if (!session) return false;
    
    if (sessionStorage.nameExists(newName, id)) {
      return false; // Duplicate name
    }
    
    const updatedSession: SessionData = {
      ...session,
      name: newName,
      groupName,
      updatedAt: new Date().toISOString(),
    };
    
    sessionStorage.save(updatedSession);
    get().loadSessions();
    return true;
  },

  setCurrentSessionId: (id: string | null) => {
    set({ currentSessionId: id });
  },
}));
