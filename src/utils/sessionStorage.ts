import type { Segment } from '../shared/lib/gapEngine/types';
import type { GapSettings } from '../shared/lib/gapEngine/settings';

export interface SessionData {
  id: string;
  name: string;
  groupName?: string; // Optional group name for categorization
  order?: number; // Optional order within group for drag and drop
  notes?: string; // Optional notes/description for the session
  createdAt: string;
  updatedAt: string;
  inputCode: string;
  segments: Segment[];
  answerKey: Record<number, string>;
  userAnswers: Record<number, string>;
  gapSettings: GapSettings;
}

const STORAGE_KEY = 'codegapper_sessions';
const GROUPS_STORAGE_KEY = 'codegapper_groups';
const GROUP_ORDER_KEY = 'codegapper_group_order';

export const sessionStorage = {
  getAll(): SessionData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  get(id: string): SessionData | null {
    const sessions = this.getAll();
    return sessions.find(s => s.id === id) || null;
  },

  save(session: SessionData): void {
    const sessions = this.getAll();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },

  delete(id: string): void {
    const sessions = this.getAll();
    const filtered = sessions.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  nameExists(name: string, excludeId?: string): boolean {
    const sessions = this.getAll();
    return sessions.some(s => s.name === name && s.id !== excludeId);
  },

  getAllGroups(): string[] {
    // Get groups from both stored groups list and from sessions
    const storedGroups = this.getStoredGroups();
    const sessions = this.getAll();
    const groups = new Set<string>(storedGroups);
    
    // Also include groups from existing sessions
    sessions.forEach(s => {
      if (s.groupName) {
        groups.add(s.groupName);
      }
    });
    
    return Array.from(groups).sort();
  },

  getStoredGroups(): string[] {
    try {
      const data = localStorage.getItem(GROUPS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveGroup(groupName: string): void {
    const groups = this.getStoredGroups();
    if (!groups.includes(groupName)) {
      groups.push(groupName);
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
    }
  },

  deleteGroup(groupName: string): void {
    const groups = this.getStoredGroups();
    const filtered = groups.filter(g => g !== groupName);
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(filtered));
  },

  renameGroup(oldGroupName: string, newGroupName: string): void {
    // Update stored groups list
    const groups = this.getStoredGroups();
    const groupIndex = groups.indexOf(oldGroupName);
    if (groupIndex !== -1) {
      groups[groupIndex] = newGroupName;
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
    } else {
      // If group wasn't in stored list, add the new name
      if (!groups.includes(newGroupName)) {
        groups.push(newGroupName);
        localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
      }
    }

    // Update all sessions that belong to this group
    const sessions = this.getAll();
    sessions.forEach((session) => {
      if (session.groupName === oldGroupName) {
        const updatedSession: SessionData = {
          ...session,
          groupName: newGroupName,
          updatedAt: new Date().toISOString(),
        };
        this.save(updatedSession);
      }
    });
  },

  getSessionsByGroup(groupName?: string): SessionData[] {
    const sessions = this.getAll();
    if (!groupName) {
      return sessions.filter(s => !s.groupName);
    }
    return sessions.filter(s => s.groupName === groupName);
  },

  getGroupOrder(): string[] {
    try {
      const data = localStorage.getItem(GROUP_ORDER_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveGroupOrder(groupOrder: string[]): void {
    try {
      localStorage.setItem(GROUP_ORDER_KEY, JSON.stringify(groupOrder));
    } catch (error) {
      console.error('Failed to save group order:', error);
    }
  },

  updateGroupOrder(sourceIndex: number, targetIndex: number): void {
    const currentOrder = this.getGroupOrder();
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
      return;
    }

    const reordered = [...currentOrder];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, removed);
    
    this.saveGroupOrder(reordered);
  },
};
