import { traverse } from 'estraverse';
import type { Node, MemberExpression, CallExpression, Identifier } from 'estree';

export interface GapInfo {
  node: Node;
  originalValue: string;
  gapId: number;
}

/**
 * Apply gap strategy to AST
 * Gaps:
 * - MemberExpression property names (e.g. user.isAdmin → user.___1___)
 * - Function call names (e.g. grantAccess() → ___3___())
 * 
 * Returns modified AST and answer key
 */
export function applyGapStrategy(ast: Node): { ast: Node; answerKey: Record<number, string> } {
  const answerKey: Record<number, string> = {};
  let gapCounter = 1;

  // Clone AST to avoid mutating original
  const modifiedAST = JSON.parse(JSON.stringify(ast)) as Node;

  traverse(modifiedAST, {
    enter(node: Node) {
      // Gap MemberExpression property names (e.g. user.isAdmin)
      if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
        const memberExpr = node as MemberExpression;
        const propertyName = (memberExpr.property as Identifier).name;
        
        // Replace property identifier with gap placeholder
        (memberExpr.property as Identifier).name = `___${gapCounter}___`;
        answerKey[gapCounter] = propertyName;
        gapCounter++;
      }

      // Gap function call names (e.g. grantAccess())
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
        const callExpr = node as CallExpression;
        const functionName = (callExpr.callee as Identifier).name;
        
        // Replace callee identifier with gap placeholder
        (callExpr.callee as Identifier).name = `___${gapCounter}___`;
        answerKey[gapCounter] = functionName;
        gapCounter++;
      }
    },
  });

  return { ast: modifiedAST, answerKey };
}
