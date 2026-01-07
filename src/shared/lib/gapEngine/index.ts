import { parseCodeToAST } from './parse';
import { collectAllEligibleNodes, selectRandomGapNodes } from './gapStrategy';
import type { Segment } from './types';
import type { GapSettings } from './settings';
import { defaultGapSettings } from './settings';
import type { Node } from 'estree';

export interface GapResult {
  segments: Segment[];
  answerKey: Record<number, string>;
}

/**
 * Main pipeline: Parse → Collect ALL Eligible Nodes → Randomize → Select → Build Segments
 * Each call regenerates segments from scratch with random node selection based on settings
 */
export function generateGaps(code: string, settings?: GapSettings): GapResult {
  // Use provided settings or default
  const gapSettings = settings || defaultGapSettings;
  
  console.log('[DEBUG] generateGaps engine - codeLength:', code.length);
  console.log('[DEBUG] generateGaps engine - settings:', JSON.stringify({
    nodeTypes: gapSettings.nodeTypes,
    countMode: gapSettings.countMode,
  }, null, 2));
  console.log('[DEBUG] generateGaps engine - code preview:', JSON.stringify(code.substring(0, 100)));

  // Step 1: Parse code to AST with location tracking (always fresh parse)
  let ast: Node;
  try {
    console.log('[DEBUG] Starting AST parsing...');
    ast = parseCodeToAST(code);
    console.log('[DEBUG] AST parsed successfully');
  } catch (parseError) {
    console.error('[DEBUG] AST parsing failed');
    console.error('[DEBUG] Parse error:', JSON.stringify({
      message: parseError instanceof Error ? parseError.message : String(parseError),
      stack: parseError instanceof Error ? parseError.stack : undefined
    }, null, 2));
    throw parseError;
  }

  // Check if any node types are enabled
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
    console.warn('[DEBUG] No node types are enabled. Please enable at least one node type in Gap Settings.');
    return {
      segments: [{ kind: 'text', value: code }],
      answerKey: {},
    };
  }

  // Step 2: Collect ALL eligible nodes based on settings (no IDs assigned yet)
  let eligibleNodes: ReturnType<typeof collectAllEligibleNodes>;
  try {
    console.log('[DEBUG] Starting collectAllEligibleNodes...');
    eligibleNodes = collectAllEligibleNodes(ast, code, gapSettings);
    console.log('[DEBUG] Eligible nodes collected - count:', eligibleNodes.length);
    if (eligibleNodes.length > 0) {
      console.log('[DEBUG] Eligible nodes collected - first 5:', JSON.stringify(
        eligibleNodes.slice(0, 5).map(n => ({ answer: n.answer, start: n.start, end: n.end })),
        null,
        2
      ));
    } else {
      console.warn('[DEBUG] No eligible nodes found! Check node type settings.');
    }
  } catch (collectError) {
    console.error('[DEBUG] collectAllEligibleNodes failed');
    console.error('[DEBUG] Collect error:', JSON.stringify({
      message: collectError instanceof Error ? collectError.message : String(collectError),
      stack: collectError instanceof Error ? collectError.stack : undefined
    }, null, 2));
    throw collectError;
  }

  // Step 3: Randomize and select gap nodes (assigns IDs)
  let gapNodes: ReturnType<typeof selectRandomGapNodes>;
  try {
    gapNodes = selectRandomGapNodes(eligibleNodes, gapSettings);
    console.log('[DEBUG] Gap nodes selected - count:', gapNodes.length);
    console.log('[DEBUG] Gap nodes selected - all nodes:', JSON.stringify(
      gapNodes.map(n => ({ id: n.id, answer: n.answer, start: n.start, end: n.end })),
      null,
      2
    ));
  } catch (selectError) {
    console.error('[DEBUG] selectRandomGapNodes failed:', selectError);
    throw selectError;
  }

  // If no gaps found, warn user
  if (gapNodes.length === 0) {
    console.warn('[DEBUG] No gap nodes found. Check your settings - enabled node types may not exist in the code.');
  }

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

  console.log('[DEBUG] Final result - segmentsCount:', segments.length);
  console.log('[DEBUG] Final result - answerKeyCount:', Object.keys(answerKey).length);
  console.log('[DEBUG] Final result - answerKey:', JSON.stringify(answerKey, null, 2));
  console.log('[DEBUG] Final result - first 5 segments:', JSON.stringify(
    segments.slice(0, 5).map(s => 
      s.kind === 'gap' 
        ? { kind: 'gap', id: s.id, answer: s.answer }
        : { kind: 'text', preview: s.value.substring(0, 50) + (s.value.length > 50 ? '...' : '') }
    ),
    null,
    2
  ));

  return { segments, answerKey };
}

export { parseCodeToAST, collectAllEligibleNodes, selectRandomGapNodes };
export type { Segment } from './types';
