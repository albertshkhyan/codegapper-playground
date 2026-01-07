import { parseCodeToAST } from './parse';
import { collectAllEligibleNodes, selectRandomGapNodes } from './gapStrategy';
import type { Segment } from './types';

export interface GapResult {
  segments: Segment[];
  answerKey: Record<number, string>;
}

/**
 * Main pipeline: Parse → Collect ALL Eligible Nodes → Randomize → Select → Build Segments
 * Each call regenerates segments from scratch with random node selection
 */
export function generateGaps(code: string, maxGaps?: number): GapResult {
  // Step 1: Parse code to AST with location tracking (always fresh parse)
  const ast = parseCodeToAST(code);

  // Step 2: Collect ALL eligible nodes (no IDs assigned yet)
  const eligibleNodes = collectAllEligibleNodes(ast, code);

  // Step 3: Randomize and select gap nodes (assigns IDs)
  const gapNodes = selectRandomGapNodes(eligibleNodes, maxGaps);

  // Step 4: Build segments by slicing original code
  const segments: Segment[] = [];
  const answerKey: Record<number, string> = {};
  let cursor = 0;

  for (const gapNode of gapNodes) {
    // Push text segment before gap
    if (gapNode.start > cursor) {
      segments.push({
        kind: 'text',
        value: code.substring(cursor, gapNode.start),
      });
    }

    // Push gap segment
    segments.push({
      kind: 'gap',
      id: gapNode.id,
      answer: gapNode.answer,
    });

    // Store answer in answerKey
    answerKey[gapNode.id] = gapNode.answer;

    // Move cursor past the gap
    cursor = gapNode.end;
  }

  // Push final trailing text segment
  if (cursor < code.length) {
    segments.push({
      kind: 'text',
      value: code.substring(cursor),
    });
  }

  // If no gaps found, return entire code as single text segment
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
