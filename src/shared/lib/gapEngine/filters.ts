import type { GapSettings } from './settings';

/**
 * Common names that are often less educational to gap
 */
const COMMON_NAMES = new Set([
  'length',
  'value',
  'index',
  'key',
  'item',
  'element',
  'data',
  'result',
  'response',
  'error',
  'name',
  'id',
  'type',
  'status',
  'count',
  'size',
]);

const BUILT_INS = new Set([
  'Promise',
  'Array',
  'Object',
  'String',
  'Number',
  'Boolean',
  'Date',
  'RegExp',
  'Math',
  'JSON',
  'console',
  'window',
  'document',
  'global',
  'globalThis',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'fetch',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'encodeURI',
  'decodeURI',
  'encodeURIComponent',
  'decodeURIComponent',
]);

const SINGLE_LETTER_VARS = new Set(['i', 'j', 'k', 'x', 'y', 'z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w']);

export function shouldExcludeNode(answer: string, settings: GapSettings): boolean {
  const { exclusions } = settings;

  if (exclusions.commonNames && COMMON_NAMES.has(answer)) {
    return true;
  }

  if (exclusions.builtIns && BUILT_INS.has(answer)) {
    return true;
  }

  if (exclusions.singleLetterVars && SINGLE_LETTER_VARS.has(answer)) {
    return true;
  }

  if (exclusions.customList.length > 0) {
    const lowerAnswer = answer.toLowerCase();
    const matches = exclusions.customList.some((excluded) => excluded.toLowerCase() === lowerAnswer);
    if (matches) {
      return true;
    }
  }

  return false;
}

export function calculateTargetGapCount(
  eligibleCount: number,
  settings: GapSettings,
  random: () => number = Math.random
): number {
  if (eligibleCount === 0) {
    return 0;
  }

  switch (settings.countMode) {
    case 'fixed':
      if (settings.fixedCount !== undefined) {
        return Math.min(settings.fixedCount, eligibleCount);
      }
      break;

    case 'range':
      if (settings.minCount !== undefined && settings.maxCount !== undefined) {
        const min = Math.min(settings.minCount, eligibleCount);
        const max = Math.min(settings.maxCount, eligibleCount);
        if (min >= max) {
          return min;
        }
        return Math.floor(random() * (max - min + 1)) + min;
      }
      break;

    case 'auto':
    default: {
      const minPercent = 0.5;
      const maxPercent = 0.8;
      const randomPercent = minPercent + random() * (maxPercent - minPercent);
      return Math.max(1, Math.floor(eligibleCount * randomPercent));
    }
  }

  return Math.max(1, Math.floor(eligibleCount * 0.65));
}
