/**
 * Gap generation settings and configuration
 */

export type GapCountMode = 'auto' | 'fixed' | 'range';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'custom';

export interface GapSettings {
  // Gap count configuration
  countMode: GapCountMode;
  fixedCount?: number;
  minCount?: number;
  maxCount?: number;

  // Node types to include
  nodeTypes: {
    properties: boolean;
    functions: boolean;
    operators: boolean;
    literals: {
      strings: boolean;
      numbers: boolean;
      booleans: boolean;
      nullUndefined: boolean;
    };
    variables: boolean;
    keywords: boolean;
    objectKeys: boolean;
    arrayElements: boolean;
  };

  // Difficulty preset (overrides other settings when not 'custom')
  difficulty: Difficulty;

  // Exclusions
  exclusions: {
    commonNames: boolean;
    builtIns: boolean;
    singleLetterVars: boolean;
    customList: string[];
  };
}

export const defaultGapSettings: GapSettings = {
  countMode: 'auto',
  nodeTypes: {
    properties: true,
    functions: true,
    operators: false,
    literals: {
      strings: false,
      numbers: false,
      booleans: false,
      nullUndefined: false,
    },
    variables: false,
    keywords: false,
    objectKeys: false,
    arrayElements: false,
  },
  difficulty: 'medium',
  exclusions: {
    commonNames: false,
    builtIns: false,
    singleLetterVars: false,
    customList: [],
  },
};

/**
 * Apply difficulty preset to settings
 */
export function applyDifficultyPreset(
  difficulty: Difficulty,
  settings: GapSettings
): GapSettings {
  if (difficulty === 'custom') {
    return settings;
  }

  const preset: Partial<GapSettings> = {};

  switch (difficulty) {
    case 'easy':
      preset.countMode = 'range';
      preset.minCount = 2;
      preset.maxCount = 4;
      preset.nodeTypes = {
        properties: true,
        functions: false,
        operators: false,
        literals: {
          strings: false,
          numbers: false,
          booleans: false,
          nullUndefined: false,
        },
        variables: false,
        keywords: false,
        objectKeys: false,
        arrayElements: false,
      };
      preset.exclusions = {
        commonNames: true,
        builtIns: false,
        singleLetterVars: false,
        customList: [],
      };
      break;

    case 'medium':
      preset.countMode = 'auto';
      preset.nodeTypes = {
        properties: true,
        functions: true,
        operators: false,
        literals: {
          strings: false,
          numbers: false,
          booleans: false,
          nullUndefined: false,
        },
        variables: false,
        keywords: false,
        objectKeys: false,
        arrayElements: false,
      };
      preset.exclusions = {
        commonNames: false,
        builtIns: false,
        singleLetterVars: false,
        customList: [],
      };
      break;

    case 'hard':
      preset.countMode = 'range';
      preset.minCount = 8;
      preset.maxCount = 12;
      preset.nodeTypes = {
        properties: true,
        functions: true,
        operators: true,
        literals: {
          strings: true,
          numbers: true,
          booleans: true,
          nullUndefined: false,
        },
        variables: true,
        keywords: true,
        objectKeys: true,
        arrayElements: false,
      };
      preset.exclusions = {
        commonNames: false,
        builtIns: false,
        singleLetterVars: false,
        customList: [],
      };
      break;
  }

  return {
    ...settings,
    ...preset,
    difficulty,
  };
}
