import { create } from 'zustand';
import { generateGaps } from '../shared/lib/gapEngine';

interface GapStore {
  // State
  inputCode: string;
  gappedCode: string;
  answerKey: Record<number, string>;
  userAnswers: Record<number, string>;
  
  // Actions
  setInputCode: (code: string) => void;
  generateGaps: () => void;
  setUserAnswer: (gapId: number, value: string) => void;
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
  gappedCode: '',
  answerKey: {},
  userAnswers: {},
};

export const useGapStore = create<GapStore>((set, get) => ({
  ...initialState,

  setInputCode: (code: string) => {
    set({ inputCode: code });
  },

  generateGaps: () => {
    const { inputCode } = get();
    if (!inputCode.trim()) {
      return;
    }

    try {
      const { gappedCode, answerKey } = generateGaps(inputCode);
      set({
        gappedCode,
        answerKey,
        userAnswers: {}, // Reset user answers when generating new gaps
      });
    } catch (error) {
      console.error('Failed to generate gaps:', error);
      // Keep existing state on error
    }
  },

  setUserAnswer: (gapId: number, value: string) => {
    set((state) => ({
      userAnswers: {
        ...state.userAnswers,
        [gapId]: value.trim(),
      },
    }));
  },

  validateAnswers: () => {
    const { answerKey, userAnswers } = get();
    const gapIds = Object.keys(answerKey).map(Number);
    const totalCount = gapIds.length;

    const correctGaps: number[] = [];
    const incorrectGaps: number[] = [];

    gapIds.forEach((gapId) => {
      const correctAnswer = answerKey[gapId]?.trim();
      const userAnswer = userAnswers[gapId]?.trim();

      if (correctAnswer && userAnswer === correctAnswer) {
        correctGaps.push(gapId);
      } else if (userAnswer) {
        incorrectGaps.push(gapId);
      }
    });

    const correctCount = correctGaps.length;
    
    // Generate hint
    let hint = '';
    if (correctCount === totalCount) {
      hint = 'Perfect! All answers are correct.';
    } else if (correctCount === 0 && totalCount > 0) {
      hint = 'Try again! Review the code structure.';
    } else if (incorrectGaps.length > 0) {
      hint = 'Almost there! Review your last answer.';
    } else {
      hint = 'Fill in all the gaps to continue.';
    }

    return {
      correctCount,
      totalCount,
      correctGaps,
      incorrectGaps,
      hint,
    };
  },

  reset: () => {
    set(initialState);
  },
}));
