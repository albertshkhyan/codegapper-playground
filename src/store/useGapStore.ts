import { create } from 'zustand';
import { generateGaps } from '../shared/lib/gapEngine';
import type { Segment } from '../shared/lib/gapEngine/types';
import type { GapSettings } from '../shared/lib/gapEngine/settings';
import { defaultGapSettings } from '../shared/lib/gapEngine/settings';

interface GapStore {
  // State
  inputCode: string;
  segments: Segment[];
  answerKey: Record<number, string>;
  userAnswers: Record<number, string>;
  gapSettings: GapSettings;
  
  // Actions
  setInputCode: (code: string) => void;
  generateGaps: () => void;
  setUserAnswer: (gapId: number, value: string) => void;
  setGapSettings: (settings: GapSettings) => void;
  resetGapSettings: () => void;
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
};

export const useGapStore = create<GapStore>((set, get) => ({
  ...initialState,

  setInputCode: (code: string) => {
    set({ inputCode: code });
  },

  generateGaps: () => {
    const { inputCode, gapSettings } = get();
    console.log('[DEBUG] generateGaps called');
    console.log('[DEBUG] inputCodeLength:', inputCode.length);
    console.log('[DEBUG] gapSettings:', JSON.stringify(gapSettings, null, 2));
    
    if (!inputCode.trim()) {
      console.warn('[DEBUG] Input code is empty');
      return;
    }

    try {
      const { segments, answerKey } = generateGaps(inputCode, gapSettings);
      console.log('[DEBUG] Generated gaps - segmentsCount:', segments.length);
      console.log('[DEBUG] Generated gaps - answerKeyCount:', Object.keys(answerKey).length);
      console.log('[DEBUG] Generated gaps - answerKey:', JSON.stringify(answerKey, null, 2));
      console.log('[DEBUG] Generated gaps - first 5 segments:', JSON.stringify(
        segments.slice(0, 5).map(s => 
          s.kind === 'gap' 
            ? { kind: 'gap', id: s.id, answer: s.answer }
            : { kind: 'text', value: s.value.substring(0, 50) + '...' }
        ), 
        null, 
        2
      ));
      
      set({
        segments,
        answerKey,
        userAnswers: {}, // Reset user answers when generating new gaps
      });
    } catch (error) {
      console.error('[DEBUG] Failed to generate gaps:', error);
      if (error instanceof Error) {
        console.error('[DEBUG] Error message:', error.message);
        console.error('[DEBUG] Error stack:', error.stack);
      }
      // Keep existing state on error
    }
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
