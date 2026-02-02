import { create } from 'zustand';
import { validateAnswers as validateAnswersPure } from '../shared/lib/gapEngine/validateAnswers';
import type { Segment } from '../shared/lib/gapEngine/types';
import type { GapSettings } from '../shared/lib/gapEngine/settings';
import { defaultGapSettings } from '../shared/lib/gapEngine/settings';
import { DEFAULT_LANGUAGE } from '../shared/constants/languages';

interface GapStore {
  inputCode: string;
  segments: Segment[];
  answerKey: Record<number, string>;
  userAnswers: Record<number, string>;
  gapSettings: GapSettings;
  hasChecked: boolean;
  selectedLanguage: string;
  
  setInputCode: (code: string) => void;
  generateGaps: () => void;
  setUserAnswer: (gapId: number, value: string) => void;
  setGapSettings: (settings: GapSettings) => void;
  resetGapSettings: () => void;
  setHasChecked: (checked: boolean) => void;
  setSelectedLanguage: (language: string) => void;
  validateAnswers: () => {
    correctCount: number;
    totalCount: number;
    correctGaps: number[];
    incorrectGaps: number[];
    hint: string;
  };
  reset: () => void;
}

const initialState = {
  inputCode: '',
  segments: [] as Segment[],
  answerKey: {},
  userAnswers: {},
  gapSettings: defaultGapSettings,
  hasChecked: false,
  selectedLanguage: DEFAULT_LANGUAGE,
};

export const useGapStore = create<GapStore>((set, get) => ({
  ...initialState,

  setInputCode: (code: string) => {
    set({ inputCode: code });
  },

  generateGaps: () => {
    const { inputCode, gapSettings } = get();

    if (!inputCode.trim()) {
      return;
    }

    import('../shared/lib/gapEngine').then(({ generateGaps: runGenerateGaps }) => {
      try {
        const { segments, answerKey } = runGenerateGaps(inputCode, gapSettings);
        set({
          segments,
          answerKey,
          userAnswers: {},
          hasChecked: false,
        });
      } catch (error) {
        console.error('Failed to generate gaps:', error);
      }
    });
  },

  setGapSettings: (settings: GapSettings) => {
    set({ gapSettings: settings });
  },

  resetGapSettings: () => {
    set({ gapSettings: defaultGapSettings });
  },

  setUserAnswer: (gapId: number, value: string) => {
    set((state) => ({
      userAnswers: {
        ...state.userAnswers,
        [gapId]: value.trim(),
      },
    }));
  },

  setHasChecked: (checked: boolean) => {
    set({ hasChecked: checked });
  },

  setSelectedLanguage: (language: string) => {
    set({ selectedLanguage: language });
  },

  validateAnswers: () => {
    const { answerKey, userAnswers } = get();
    return validateAnswersPure(answerKey, userAnswers);
  },

  reset: () => {
    set(initialState);
  },
}));
