import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldExcludeNode, calculateTargetGapCount } from './filters';
import type { GapSettings } from './settings';
import { defaultGapSettings } from './settings';

function baseSettings(overrides: Partial<GapSettings> = {}): GapSettings {
  return { ...defaultGapSettings, ...overrides };
}

describe('shouldExcludeNode', () => {
  it('returns false when all exclusions are off', () => {
    const settings = baseSettings({
      exclusions: { commonNames: false, builtIns: false, singleLetterVars: false, customList: [] },
    });
    expect(shouldExcludeNode('length', settings)).toBe(false);
    expect(shouldExcludeNode('Array', settings)).toBe(false);
    expect(shouldExcludeNode('x', settings)).toBe(false);
  });

  it('returns true for common names when exclusions.commonNames is true', () => {
    const settings = baseSettings({
      exclusions: { commonNames: true, builtIns: false, singleLetterVars: false, customList: [] },
    });
    expect(shouldExcludeNode('length', settings)).toBe(true);
    expect(shouldExcludeNode('value', settings)).toBe(true);
    expect(shouldExcludeNode('index', settings)).toBe(true);
    expect(shouldExcludeNode('foo', settings)).toBe(false);
  });

  it('returns true for built-ins when exclusions.builtIns is true', () => {
    const settings = baseSettings({
      exclusions: { commonNames: false, builtIns: true, singleLetterVars: false, customList: [] },
    });
    expect(shouldExcludeNode('Promise', settings)).toBe(true);
    expect(shouldExcludeNode('Array', settings)).toBe(true);
    expect(shouldExcludeNode('fetch', settings)).toBe(true);
    expect(shouldExcludeNode('customFn', settings)).toBe(false);
  });

  it('returns true for single-letter vars when exclusions.singleLetterVars is true', () => {
    const settings = baseSettings({
      exclusions: { commonNames: false, builtIns: false, singleLetterVars: true, customList: [] },
    });
    expect(shouldExcludeNode('i', settings)).toBe(true);
    expect(shouldExcludeNode('x', settings)).toBe(true);
    expect(shouldExcludeNode('ab', settings)).toBe(false);
  });

  it('returns true when answer is in customList (case-insensitive)', () => {
    const settings = baseSettings({
      exclusions: { commonNames: false, builtIns: false, singleLetterVars: false, customList: ['myVar', 'Other'] },
    });
    expect(shouldExcludeNode('myVar', settings)).toBe(true);
    expect(shouldExcludeNode('other', settings)).toBe(true);
    expect(shouldExcludeNode('OTHER', settings)).toBe(true);
    expect(shouldExcludeNode('otherVar', settings)).toBe(false);
  });

  it('returns false when customList is empty even if other exclusions match', () => {
    const settings = baseSettings({
      exclusions: { commonNames: true, builtIns: false, singleLetterVars: false, customList: [] },
    });
    expect(shouldExcludeNode('length', settings)).toBe(true);
    expect(shouldExcludeNode('unknown', settings)).toBe(false);
  });
});

describe('calculateTargetGapCount', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 0 when eligibleCount is 0', () => {
    expect(calculateTargetGapCount(0, baseSettings({ countMode: 'fixed', fixedCount: 5 }))).toBe(0);
  });

  it('fixed mode: returns min(fixedCount, eligibleCount)', () => {
    const settings = baseSettings({ countMode: 'fixed', fixedCount: 5 });
    expect(calculateTargetGapCount(10, settings)).toBe(5);
    expect(calculateTargetGapCount(3, settings)).toBe(3);
  });

  it('fixed mode: when fixedCount undefined uses fallback', () => {
    const settings = baseSettings({ countMode: 'fixed' });
    expect(calculateTargetGapCount(10, settings)).toBe(Math.max(1, Math.floor(10 * 0.65)));
  });

  it('range mode: when min >= max after clamp returns min', () => {
    const settings = baseSettings({ countMode: 'range', minCount: 3, maxCount: 2 });
    expect(calculateTargetGapCount(10, settings)).toBe(3);
  });

  it('range mode: with mocked random returns deterministic value', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const settings = baseSettings({ countMode: 'range', minCount: 2, maxCount: 5 });
    expect(calculateTargetGapCount(10, settings)).toBe(2);
    vi.restoreAllMocks();
  });

  it('range mode: with random 1 returns max of range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const settings = baseSettings({ countMode: 'range', minCount: 2, maxCount: 5 });
    expect(calculateTargetGapCount(10, settings)).toBe(5);
    vi.restoreAllMocks();
  });

  it('auto mode: with mocked random returns deterministic value', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const settings = baseSettings({ countMode: 'auto' });
    const result = calculateTargetGapCount(10, settings);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(10);
    expect(result).toBe(6);
    vi.restoreAllMocks();
  });

  it('fallback when countMode is invalid returns at least 1', () => {
    const settings = baseSettings({ countMode: 'fixed' });
    expect(calculateTargetGapCount(10, settings)).toBeGreaterThanOrEqual(1);
  });
});
