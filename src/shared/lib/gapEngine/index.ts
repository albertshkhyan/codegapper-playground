import { parseCodeToAST } from './parse';
import { collectAllEligibleNodes, selectRandomGapNodes } from './gapStrategy';
import type { Segment } from './types';
import type { GapSettings } from './settings';
import { defaultGapSettings } from './settings';
export interface GapResult {
  segments: Segment[];
  answerKey: Record<number, string>;
}

export interface GenerateGapsOptions {
  random?: () => number;
}

export function generateGaps(
  code: string,
  settings?: GapSettings,
  options?: GenerateGapsOptions
): GapResult {
  const gapSettings = settings || defaultGapSettings;
  const random = options?.random ?? Math.random;

  const ast = parseCodeToAST(code);

  const hasEnabledNodeTypes = 
    gapSettings.nodeTypes.properties ||
    gapSettings.nodeTypes.functions ||
    gapSettings.nodeTypes.operators ||
    gapSettings.nodeTypes.variables ||
    gapSettings.nodeTypes.keywords ||
    gapSettings.nodeTypes.literals.strings ||
    gapSettings.nodeTypes.literals.numbers ||
    gapSettings.nodeTypes.literals.booleans ||
    gapSettings.nodeTypes.literals.nullUndefined;
  
  if (!hasEnabledNodeTypes) {
    return {
      segments: [{ kind: 'text', value: code }],
      answerKey: {},
    };
  }

  const eligibleNodes = collectAllEligibleNodes(ast, code, gapSettings);
  const gapNodes = selectRandomGapNodes(eligibleNodes, gapSettings, random);

  const segments: Segment[] = [];
  const answerKey: Record<number, string> = {};
  let cursor = 0;

  for (const gapNode of gapNodes) {
    if (gapNode.start > cursor) {
      segments.push({
        kind: 'text',
        value: code.substring(cursor, gapNode.start),
      });
    }

    segments.push({
      kind: 'gap',
      id: gapNode.id,
      answer: gapNode.answer,
    });

    answerKey[gapNode.id] = gapNode.answer;
    cursor = gapNode.end;
  }

  if (cursor < code.length) {
    segments.push({
      kind: 'text',
      value: code.substring(cursor),
    });
  }

  if (segments.length === 0) {
    segments.push({
      kind: 'text',
      value: code,
    });
  }

  return { segments, answerKey };
}

export { parseCodeToAST, collectAllEligibleNodes, selectRandomGapNodes };
export type { Segment } from './types';
