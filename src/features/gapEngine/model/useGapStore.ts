import { create } from 'zustand'
import type { Gap } from '../lib/generateGaps'

interface GapState {
  code: string
  gaps: Gap[]
  setCode: (code: string) => void
  setGaps: (gaps: Gap[]) => void
}

export const useGapStore = create<GapState>((set: (fn: (state: GapState) => Partial<GapState>) => void) => ({
  code: '',
  gaps: [],
  setCode: (code: string) => set(() => ({ code })),
  setGaps: (gaps: Gap[]) => set(() => ({ gaps })),
})) 