import { parse } from 'acorn';
import type { Node } from 'estree';

/**
 * Parse JavaScript code to AST
 * Returns ESTree-compatible AST node
 */
export function parseCodeToAST(code: string): Node {
  console.log('[DEBUG] parseCodeToAST - called with code length:', code.length);
  
  // Try parsing the code as-is first
  try {
    console.log('[DEBUG] parseCodeToAST - calling acorn.parse...');
    const ast = parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true, // Enable location tracking for start/end positions
    }) as unknown as Node;
    console.log('[DEBUG] parseCodeToAST - parse successful, AST type:', (ast as any).type);
    return ast;
  } catch (error) {
    // If parsing fails with "return outside function", try wrapping in an IIFE
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("'return' outside of function") || errorMessage.includes('return outside')) {
      console.log('[DEBUG] parseCodeToAST - return outside function detected, wrapping in IIFE...');
      try {
        // Wrap code in an IIFE to make return statements valid
        // We'll adjust positions later if needed, but for now this allows parsing
        const wrappedCode = `(function() {\n${code}\n})();`;
        const ast = parse(wrappedCode, {
          ecmaVersion: 'latest',
          sourceType: 'module',
          locations: true,
        }) as unknown as Node;
        
        console.log('[DEBUG] parseCodeToAST - wrapped parse successful, AST type:', (ast as any).type);
        
        // Extract the inner function body AST
        // The structure will be: Program -> ExpressionStatement -> CallExpression -> FunctionExpression
        if ((ast as any).type === 'Program' && (ast as any).body?.[0]) {
          const callExpr = (ast as any).body[0].expression;
          if (callExpr?.type === 'CallExpression' && callExpr.callee?.type === 'FunctionExpression') {
            const funcBody = callExpr.callee.body;
            // Adjust positions: subtract the wrapper prefix length
            const wrapperPrefix = '(function() {\n';
            const adjustPositions = (node: any): void => {
              if (node && typeof node === 'object') {
                if (node.start !== undefined) {
                  node.start = Math.max(0, node.start - wrapperPrefix.length);
                }
                if (node.end !== undefined) {
                  node.end = Math.max(0, node.end - wrapperPrefix.length);
                }
                // Recursively adjust all child nodes
                for (const key in node) {
                  if (key !== 'start' && key !== 'end' && typeof node[key] === 'object') {
                    adjustPositions(node[key]);
                  }
                }
              }
            };
            adjustPositions(funcBody);
            return funcBody as Node;
          }
        }
        
        // Fallback: return the full AST (positions will be off, but parsing works)
        return ast;
      } catch (wrapError) {
        console.error('[DEBUG] parseCodeToAST - wrapped parse also failed');
        throw new Error(`Failed to parse code even after wrapping: ${wrapError instanceof Error ? wrapError.message : 'Unknown error'}`);
      }
    }
    
    // For other errors, throw as-is
    console.error('[DEBUG] parseCodeToAST - parse failed');
    console.error('[DEBUG] parseCodeToAST - error:', JSON.stringify({
      message: errorMessage,
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined
    }, null, 2));
    throw new Error(`Failed to parse code: ${errorMessage}`);
  }
}
