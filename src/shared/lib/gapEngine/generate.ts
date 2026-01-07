import * as escodegen from 'escodegen';
import type { Node } from 'estree';

/**
 * Generate JavaScript code from AST
 */
export function generateCode(ast: Node): string {
  try {
    return escodegen.generate(ast, {
      format: {
        indent: {
          style: '  ',
        },
        newline: '\n',
        quotes: 'single',
      },
    });
  } catch (error) {
    throw new Error(`Failed to generate code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
