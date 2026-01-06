import { create } from 'zustand'

export type Theme = 'light' | 'dark'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GapType = 'identifier' | 'operator' | 'propertyAccess' | 'objectKey' | 'literal' | 'template'

interface SettingsState {
  theme: Theme
  setTheme: (theme: Theme) => void
  difficulty: Difficulty
  setDifficulty: (difficulty: Difficulty) => void
  showHints: boolean
  setShowHints: (show: boolean) => void
  allowedGapTypes: GapType[]
  setAllowedGapTypes: (types: GapType[]) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  difficulty: 'easy',
  setDifficulty: (difficulty) => set({ difficulty }),
  showHints: false,
  setShowHints: (show) => set({ showHints: show }),
  allowedGapTypes: ['identifier', 'operator', 'propertyAccess', 'objectKey', 'literal', 'template'],
  setAllowedGapTypes: (types) => set({ allowedGapTypes: types }),
})) 