import { describe, it, expect } from 'vitest';
import { applyDifficultyPreset, defaultGapSettings } from './settings';
import type { GapSettings } from './settings';

describe('applyDifficultyPreset', () => {
  const base: GapSettings = { ...defaultGapSettings };

  it('returns settings unchanged when difficulty is custom', () => {
    const result = applyDifficultyPreset('custom', base);
    expect(result).toBe(base);
  });

  it('easy: sets countMode range, minCount 2, maxCount 4', () => {
    const result = applyDifficultyPreset('easy', base);
    expect(result.difficulty).toBe('easy');
    expect(result.countMode).toBe('range');
    expect(result.minCount).toBe(2);
    expect(result.maxCount).toBe(4);
  });

  it('easy: enables only properties, exclusions commonNames true', () => {
    const result = applyDifficultyPreset('easy', base);
    expect(result.nodeTypes.properties).toBe(true);
    expect(result.nodeTypes.functions).toBe(false);
    expect(result.nodeTypes.operators).toBe(false);
    expect(result.exclusions.commonNames).toBe(true);
    expect(result.exclusions.builtIns).toBe(false);
    expect(result.exclusions.singleLetterVars).toBe(false);
  });

  it('medium: sets countMode auto', () => {
    const result = applyDifficultyPreset('medium', base);
    expect(result.difficulty).toBe('medium');
    expect(result.countMode).toBe('auto');
  });

  it('medium: enables properties and functions, no exclusions', () => {
    const result = applyDifficultyPreset('medium', base);
    expect(result.nodeTypes.properties).toBe(true);
    expect(result.nodeTypes.functions).toBe(true);
    expect(result.nodeTypes.operators).toBe(false);
    expect(result.exclusions.commonNames).toBe(false);
  });

  it('hard: sets countMode range, minCount 8, maxCount 12', () => {
    const result = applyDifficultyPreset('hard', base);
    expect(result.difficulty).toBe('hard');
    expect(result.countMode).toBe('range');
    expect(result.minCount).toBe(8);
    expect(result.maxCount).toBe(12);
  });

  it('hard: enables properties, functions, operators, variables, keywords, literals', () => {
    const result = applyDifficultyPreset('hard', base);
    expect(result.nodeTypes.properties).toBe(true);
    expect(result.nodeTypes.functions).toBe(true);
    expect(result.nodeTypes.operators).toBe(true);
    expect(result.nodeTypes.variables).toBe(true);
    expect(result.nodeTypes.keywords).toBe(true);
    expect(result.nodeTypes.literals.strings).toBe(true);
    expect(result.nodeTypes.literals.numbers).toBe(true);
    expect(result.nodeTypes.literals.booleans).toBe(true);
    expect(result.nodeTypes.objectKeys).toBe(true);
  });

  it('merges preset with existing settings', () => {
    const custom = { ...base, fixedCount: 99 };
    const result = applyDifficultyPreset('easy', custom);
    expect(result.difficulty).toBe('easy');
    expect(result.countMode).toBe('range');
    expect(result.minCount).toBe(2);
    expect(result.maxCount).toBe(4);
  });
});
