import { parseCodeToAST } from './parse';
import { collectGapNodes } from './gapStrategy';
import type { Segment } from './types';

export interface GapResult {
  segments: Segment[];
  answerKey: Record<number, string>;
}

/**
 * Main pipeline: Parse → Collect Gap Nodes → Build Segments
 */
export function generateGaps(code: string): GapResult {
  // Step 1: Parse code to AST with location tracking
  const ast = parseCodeToAST(code);

  // Step 2: Collect eligible nodes with positions from original code
  const gapNodes = collectGapNodes(ast, code);

  // Step 3: Build segments by slicing original code
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

export { parseCodeToAST, collectGapNodes };
export type { Segment };
