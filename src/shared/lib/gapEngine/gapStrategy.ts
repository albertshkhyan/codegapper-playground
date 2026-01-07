import { traverse } from 'estraverse';
import type { Node, MemberExpression, CallExpression } from 'estree';

export interface GapNode {
  start: number;
  end: number;
  answer: string;
  id: number;
}

export interface EligibleNode {
  start: number;
  end: number;
  answer: string;
}

// Acorn adds start/end properties when locations: true, but they're not in ESTree types
type NodeWithLocation = Node & {
  start?: number;
  end?: number;
};

/**
 * Fisher-Yates shuffle algorithm for randomizing array order
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Collect ALL eligible AST nodes with their positions from the ORIGINAL code
 * Does NOT assign IDs - that happens after randomization
 * Gaps:
 * - MemberExpression property names (e.g. user.isAdmin)
 * - Function call names (e.g. grantAccess())
 * 
 * Returns array of eligible nodes (unsorted, no IDs)
 */
export function collectAllEligibleNodes(ast: Node, originalCode: string): EligibleNode[] {
  const eligibleNodes: EligibleNode[] = [];

  traverse(ast, {
    enter(node: Node) {
      // Gap MemberExpression property names (e.g. user.isAdmin)
      if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
        const memberExpr = node as MemberExpression;
        const propertyNode = memberExpr.property as NodeWithLocation;
        
        // Use the property identifier's location
        if (propertyNode.start !== undefined && propertyNode.end !== undefined) {
          const answer = originalCode.substring(propertyNode.start, propertyNode.end);
          eligibleNodes.push({
            start: propertyNode.start,
            end: propertyNode.end,
            answer,
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
          eligibleNodes.push({
            start: calleeNode.start,
            end: calleeNode.end,
            answer,
          });
        }
      }
    },
  });

  return eligibleNodes;
}

/**
 * Randomly select a subset of eligible nodes and assign sequential IDs
 * - Shuffles eligible nodes randomly
 * - Selects all nodes (or can be limited to maxGaps)
 * - Assigns sequential IDs starting from 1
 * - Sorts by start position for segment building
 */
export function selectRandomGapNodes(
  eligibleNodes: EligibleNode[],
  maxGaps?: number
): GapNode[] {
  if (eligibleNodes.length === 0) {
    return [];
  }

  // Shuffle for randomization
  const shuffled = shuffleArray(eligibleNodes);
  
  // Determine how many nodes to select
  let targetCount: number;
  if (maxGaps !== undefined) {
    // Use maxGaps if specified
    targetCount = Math.min(maxGaps, eligibleNodes.length);
  } else {
    // Randomly select 50-80% of eligible nodes (minimum 1, maximum all)
    const minPercent = 0.5;
    const maxPercent = 0.8;
    const randomPercent = minPercent + Math.random() * (maxPercent - minPercent);
    targetCount = Math.max(1, Math.floor(eligibleNodes.length * randomPercent));
  }
  
  // Select the first N nodes from shuffled array (they're already randomized)
  const selected = shuffled.slice(0, targetCount);
  
  // Sort by start position ascending (required for segment building)
  selected.sort((a, b) => a.start - b.start);
  
  // Assign sequential IDs starting from 1
  return selected.map((node, index) => ({
    ...node,
    id: index + 1,
  }));
}
