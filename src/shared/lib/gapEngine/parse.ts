import { parse } from 'acorn';
import type { Node } from 'estree';

/**
 * Parse JavaScript code to AST
 * Returns ESTree-compatible AST node
 */
export function parseCodeToAST(code: string): Node {
  try {
    const ast = parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    }) as unknown as Node;
    return ast;
  } catch (error) {
    throw new Error(`Failed to parse code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
