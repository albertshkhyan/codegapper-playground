import { create } from 'zustand'

interface ResultState {
  answers: Record<string, string>
  setAnswers: (answers: Record<string, string>) => void
}

export const useResultStore = create<ResultState>((set) => ({
  answers: {},
  setAnswers: (answers) => set({ answers }),
})) 