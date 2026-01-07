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

/**
 * Built-in JavaScript identifiers
 */
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

/**
 * Single-letter variable names
 */
const SINGLE_LETTER_VARS = new Set(['i', 'j', 'k', 'x', 'y', 'z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w']);

/**
 * Check if a node should be excluded based on settings
 */
export function shouldExcludeNode(answer: string, settings: GapSettings): boolean {
  const { exclusions } = settings;

  // Check common names
  if (exclusions.commonNames && COMMON_NAMES.has(answer)) {
    return true;
  }

  // Check built-ins
  if (exclusions.builtIns && BUILT_INS.has(answer)) {
    return true;
  }

  // Check single-letter vars
  if (exclusions.singleLetterVars && SINGLE_LETTER_VARS.has(answer)) {
    return true;
  }

  // Check custom exclusion list
  if (exclusions.customList.length > 0) {
    const lowerAnswer = answer.toLowerCase();
    if (exclusions.customList.some((excluded) => excluded.toLowerCase() === lowerAnswer)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate target gap count based on settings
 */
export function calculateTargetGapCount(
  eligibleCount: number,
  settings: GapSettings
): number {
  if (eligibleCount === 0) {
    return 0;
  }

  switch (settings.countMode) {
    case 'fixed':
      if (settings.fixedCount !== undefined) {
        return Math.min(settings.fixedCount, eligibleCount);
      }
      // Fall through to auto if fixedCount not set
      break;

    case 'range':
      if (settings.minCount !== undefined && settings.maxCount !== undefined) {
        const min = Math.min(settings.minCount, eligibleCount);
        const max = Math.min(settings.maxCount, eligibleCount);
        if (min >= max) {
          return min;
        }
        // Random between min and max
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      // Fall through to auto if range not set
      break;

    case 'auto':
    default:
      // Randomly select 50-80% of eligible nodes
      const minPercent = 0.5;
      const maxPercent = 0.8;
      const randomPercent = minPercent + Math.random() * (maxPercent - minPercent);
      return Math.max(1, Math.floor(eligibleCount * randomPercent));
  }

  // Default fallback
  return Math.max(1, Math.floor(eligibleCount * 0.65));
}
