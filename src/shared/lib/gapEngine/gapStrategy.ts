import { traverse } from 'estraverse';
import type { Node, MemberExpression, CallExpression } from 'estree';

export interface GapNode {
  start: number;
  end: number;
  answer: string;
  id: number;
}

// Acorn adds start/end properties when locations: true, but they're not in ESTree types
type NodeWithLocation = Node & {
  start?: number;
  end?: number;
};

/**
 * Apply gap strategy to AST
 * Collects eligible nodes with their positions from the ORIGINAL code
 * Gaps:
 * - MemberExpression property names (e.g. user.isAdmin)
 * - Function call names (e.g. grantAccess())
 * 
 * Returns array of gap nodes sorted by start position
 */
export function collectGapNodes(ast: Node, originalCode: string): GapNode[] {
  const gapNodes: GapNode[] = [];
  let gapCounter = 1;

  traverse(ast, {
    enter(node: Node) {
      // Gap MemberExpression property names (e.g. user.isAdmin)
      if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
        const memberExpr = node as MemberExpression;
        const propertyNode = memberExpr.property as NodeWithLocation;
        
        // Use the property identifier's location
        if (propertyNode.start !== undefined && propertyNode.end !== undefined) {
          const answer = originalCode.substring(propertyNode.start, propertyNode.end);
          gapNodes.push({
            start: propertyNode.start,
            end: propertyNode.end,
            answer,
            id: gapCounter++,
          });
        }
      }

      // Gap function call names (e.g. grantAccess())
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
        const callExpr = node as CallExpression;
        const calleeNode = callExpr.callee as NodeWithLocation;
        
        // Use the callee identifier's location
        if (calleeNode.start !== undefined && calleeNode.end !== undefined) {
          const answer = originalCode.substring(calleeNode.start, calleeNode.end);
          gapNodes.push({
            start: calleeNode.start,
            end: calleeNode.end,
            answer,
            id: gapCounter++,
          });
        }
      }
    },
  });

  // Sort by start position ascending
  gapNodes.sort((a, b) => a.start - b.start);

  return gapNodes;
}
