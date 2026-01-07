import { parseCodeToAST } from './parse';
import { applyGapStrategy } from './gapStrategy';
import { generateCode } from './generate';

export interface GapResult {
  gappedCode: string;
  answerKey: Record<number, string>;
}

/**
 * Main pipeline: Parse → Apply Gaps → Generate
 */
export function generateGaps(code: string): GapResult {
  // Step 1: Parse code to AST
  const ast = parseCodeToAST(code);

  // Step 2: Apply gap strategy
  const { ast: gappedAST, answerKey } = applyGapStrategy(ast);

  // Step 3: Generate gapped code
  const gappedCode = generateCode(gappedAST);

  return { gappedCode, answerKey };
}

export { parseCodeToAST, applyGapStrategy, generateCode };
