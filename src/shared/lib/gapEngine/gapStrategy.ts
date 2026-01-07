import { traverse } from 'estraverse';
import type { Node, MemberExpression, CallExpression, Literal, VariableDeclarator, BinaryExpression, LogicalExpression } from 'estree';
import type { GapSettings } from './settings';
import { shouldExcludeNode, calculateTargetGapCount } from './filters';

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
 * Filters nodes based on settings (node types and exclusions)
 * Does NOT assign IDs - that happens after randomization
 * 
 * Returns array of eligible nodes (unsorted, no IDs)
 */
export function collectAllEligibleNodes(
  ast: Node,
  originalCode: string,
  settings: GapSettings
): EligibleNode[] {
  const eligibleNodes: EligibleNode[] = [];

  traverse(ast, {
    enter(node: Node) {
      // Gap MemberExpression property names (e.g. user.isAdmin)
      if (
        settings.nodeTypes.properties &&
        node.type === 'MemberExpression' &&
        node.property.type === 'Identifier'
      ) {
        const memberExpr = node as MemberExpression;
        const propertyNode = memberExpr.property as NodeWithLocation;
        
        if (propertyNode.start !== undefined && propertyNode.end !== undefined) {
          const answer = originalCode.substring(propertyNode.start, propertyNode.end);
          
          // Apply exclusions
          if (!shouldExcludeNode(answer, settings)) {
            eligibleNodes.push({
              start: propertyNode.start,
              end: propertyNode.end,
              answer,
            });
          }
        }
      }

      // Gap function call names (e.g. grantAccess())
      if (
        settings.nodeTypes.functions &&
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier'
      ) {
        const callExpr = node as CallExpression;
        const calleeNode = callExpr.callee as NodeWithLocation;
        
        if (calleeNode.start !== undefined && calleeNode.end !== undefined) {
          const answer = originalCode.substring(calleeNode.start, calleeNode.end);
          
          // Apply exclusions
          if (!shouldExcludeNode(answer, settings)) {
            eligibleNodes.push({
              start: calleeNode.start,
              end: calleeNode.end,
              answer,
            });
          }
        }
      }

      // Gap operators (&&, ||, ===, etc.)
      if (settings.nodeTypes.operators) {
        if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
          const expr = node as BinaryExpression | LogicalExpression;
          const operatorNode = expr as NodeWithLocation;
          
          if (operatorNode.start !== undefined && operatorNode.end !== undefined) {
            const operator = expr.operator;
            
            // Find operator position in source code
            // The operator is between left.end and right.start
            const leftNode = expr.left as NodeWithLocation;
            const rightNode = expr.right as NodeWithLocation;
            
            if (leftNode.end !== undefined && rightNode.start !== undefined) {
              // Extract the code between left and right operands
              const betweenCode = originalCode.substring(leftNode.end, rightNode.start);
              
              // Find the operator in the code (handle whitespace around it)
              // The operator from AST should appear in the betweenCode
              const trimmedBetween = betweenCode.trim();
              const operatorIndex = trimmedBetween.indexOf(operator);
              
              if (operatorIndex !== -1) {
                // Calculate actual position accounting for leading whitespace
                const leadingWhitespace = betweenCode.length - betweenCode.trimStart().length;
                const operatorStart = leftNode.end + leadingWhitespace + operatorIndex;
                const operatorEnd = operatorStart + operator.length;
                
                // Apply exclusions (operators typically won't be excluded, but check anyway)
                if (!shouldExcludeNode(operator, settings)) {
                  eligibleNodes.push({
                    start: operatorStart,
                    end: operatorEnd,
                    answer: operator,
                  });
                }
              }
            }
          }
        }
      }

      // Gap literals (strings, numbers, booleans)
      if (
        node.type === 'Literal' &&
        (settings.nodeTypes.literals.strings ||
          settings.nodeTypes.literals.numbers ||
          settings.nodeTypes.literals.booleans ||
          settings.nodeTypes.literals.nullUndefined)
      ) {
        const literal = node as Literal;
        const literalNode = literal as NodeWithLocation;
        
        if (literalNode.start !== undefined && literalNode.end !== undefined) {
          const answer = originalCode.substring(literalNode.start, literalNode.end);
          const value = literal.value;
          
          // Check if this literal type is enabled
          let shouldInclude = false;
          if (typeof value === 'string' && settings.nodeTypes.literals.strings) {
            shouldInclude = true;
          } else if (typeof value === 'number' && settings.nodeTypes.literals.numbers) {
            shouldInclude = true;
          } else if (typeof value === 'boolean' && settings.nodeTypes.literals.booleans) {
            shouldInclude = true;
          } else if ((value === null || value === undefined) && settings.nodeTypes.literals.nullUndefined) {
            shouldInclude = true;
          }
          
          if (shouldInclude && !shouldExcludeNode(answer, settings)) {
            eligibleNodes.push({
              start: literalNode.start,
              end: literalNode.end,
              answer,
            });
          }
        }
      }

      // Gap variable declarations (let x, const y)
      if (settings.nodeTypes.variables && node.type === 'VariableDeclarator') {
        const declarator = node as VariableDeclarator;
        if (declarator.id.type === 'Identifier') {
          const idNode = declarator.id as NodeWithLocation;
          
          if (idNode.start !== undefined && idNode.end !== undefined) {
            const answer = originalCode.substring(idNode.start, idNode.end);
            
            if (!shouldExcludeNode(answer, settings)) {
              eligibleNodes.push({
                start: idNode.start,
                end: idNode.end,
                answer,
              });
            }
          }
        }
      }

      // Gap keywords (if, return, async, etc.)
      if (settings.nodeTypes.keywords) {
        // Keywords are handled differently - they're part of the node type itself
        // For now, we'll skip this as it requires more complex AST manipulation
        // This can be implemented in a future iteration
      }
    },
  });

  return eligibleNodes;
}

/**
 * Randomly select a subset of eligible nodes and assign sequential IDs
 * - Shuffles eligible nodes randomly
 * - Selects nodes based on settings (count mode)
 * - Assigns sequential IDs starting from 1
 * - Sorts by start position for segment building
 */
export function selectRandomGapNodes(
  eligibleNodes: EligibleNode[],
  settings: GapSettings
): GapNode[] {
  if (eligibleNodes.length === 0) {
    return [];
  }

  // Shuffle for randomization
  const shuffled = shuffleArray(eligibleNodes);
  
  // Calculate target count based on settings
  const targetCount = calculateTargetGapCount(eligibleNodes.length, settings);
  
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
