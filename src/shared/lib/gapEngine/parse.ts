import { parse } from 'acorn';
import type { Node, Program, CallExpression, FunctionExpression } from 'estree';

type NodeWithPosition = {
  start?: number;
  end?: number;
  [key: string]: unknown;
};

function adjustPositions(node: NodeWithPosition | null, offset: number): void {
  if (node && typeof node === 'object') {
    if (node.start !== undefined) {
      node.start = Math.max(0, node.start - offset);
    }
    if (node.end !== undefined) {
      node.end = Math.max(0, node.end - offset);
    }
    for (const key of Object.keys(node)) {
      if (key !== 'start' && key !== 'end') {
        const value = node[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          adjustPositions(value as NodeWithPosition, offset);
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object') {
              adjustPositions(item as NodeWithPosition, offset);
            }
          }
        }
      }
    }
  }
}

export function parseCodeToAST(code: string): Node {
  try {
    const ast = parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
    }) as unknown as Node;
    return ast;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("'return' outside of function") || errorMessage.includes('return outside')) {
      try {
        const wrappedCode = `(function() {\n${code}\n})();`;
        const ast = parse(wrappedCode, {
          ecmaVersion: 'latest',
          sourceType: 'module',
          locations: true,
        }) as unknown as Program;
        const firstStatement = ast.body?.[0];
        if (firstStatement?.type === 'ExpressionStatement') {
          const callExpr = firstStatement.expression as CallExpression;
          if (callExpr?.type === 'CallExpression' && callExpr.callee?.type === 'FunctionExpression') {
            const funcBody = (callExpr.callee as FunctionExpression).body;
            const wrapperPrefix = '(function() {\n';
            adjustPositions(funcBody as unknown as NodeWithPosition, wrapperPrefix.length);
            return funcBody as Node;
          }
        }
        return ast as Node;
      } catch (wrapError) {
        throw new Error(`Failed to parse code even after wrapping: ${wrapError instanceof Error ? wrapError.message : 'Unknown error'}`);
      }
    }
    
    throw new Error(`Failed to parse code: ${errorMessage}`);
  }
}
