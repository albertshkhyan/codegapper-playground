import { traverse } from 'estraverse';
import type { 
  Node, 
  MemberExpression, 
  CallExpression, 
  Literal, 
  VariableDeclarator, 
  BinaryExpression, 
  LogicalExpression,
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunctionExpression
} from 'estree';
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
  console.log('[DEBUG] collectAllEligibleNodes - called');
  console.log('[DEBUG] collectAllEligibleNodes - settings:', JSON.stringify({
    properties: settings.nodeTypes.properties,
    functions: settings.nodeTypes.functions,
    operators: settings.nodeTypes.operators,
  }, null, 2));
  
  const eligibleNodes: EligibleNode[] = [];

  try {
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
            } else {
              // Debug: operator not found in betweenCode
              console.warn('[DEBUG] Operator not found in code', {
                operator,
                betweenCode: JSON.stringify(betweenCode),
                trimmedBetween: JSON.stringify(trimmedBetween),
                leftEnd: leftNode.end,
                rightStart: rightNode.start
              });
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

      // Gap function parameters (item, index in forEach((item, index) => ...))
      if (settings.nodeTypes.variables) {
        if (
          node.type === 'ArrowFunctionExpression' ||
          node.type === 'FunctionExpression' ||
          node.type === 'FunctionDeclaration'
        ) {
          console.log('[DEBUG] Found function node:', node.type);
          const funcNode = node as ArrowFunctionExpression | FunctionExpression | FunctionDeclaration;
          
          if (funcNode.params && Array.isArray(funcNode.params)) {
            console.log('[DEBUG] Function has params:', funcNode.params.length, funcNode.params.map((p) => (p as Node).type));
            funcNode.params.forEach((param) => {
              // Only handle Identifier parameters (not destructured like {x, y} or [a, b])
              if (param.type === 'Identifier') {
                const paramNode = param as NodeWithLocation;
                
                if (paramNode.start !== undefined && paramNode.end !== undefined) {
                  const answer = originalCode.substring(paramNode.start, paramNode.end);
                  console.log('[DEBUG] Function parameter found:', answer, 'at', paramNode.start, '-', paramNode.end);
                  console.log('[DEBUG] Checking exclusion for:', answer, 'exclusions:', JSON.stringify(settings.exclusions.customList));
                  
                  const shouldExclude = shouldExcludeNode(answer, settings);
                  console.log('[DEBUG] Should exclude?', shouldExclude);
                  
                  if (!shouldExclude) {
                    console.log('[DEBUG] Adding parameter to eligible nodes:', answer);
                    eligibleNodes.push({
                      start: paramNode.start,
                      end: paramNode.end,
                      answer,
                    });
                  } else {
                    console.log('[DEBUG] Parameter excluded:', answer);
                  }
                }
              } else {
                console.log('[DEBUG] Parameter is not Identifier, type:', param.type);
              }
            });
          } else {
            console.log('[DEBUG] Function has no params or params is not array');
          }
        }
      }

      // Gap keywords (if, return, async, etc.)
      if (settings.nodeTypes.keywords) {
        const nodeWithLocation = node as NodeWithLocation;
        
        if (nodeWithLocation.start !== undefined) {
          // Extract keyword from the beginning of the node
          let keyword: string | null = null;
          let keywordStart: number | undefined;
          let keywordEnd: number | undefined;
          
          // IfStatement - extract "if"
          if (node.type === 'IfStatement') {
            keyword = 'if';
            keywordStart = nodeWithLocation.start;
            // Find "if" at the start of the node
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const ifIndex = nodeStartCode.indexOf('if');
            if (ifIndex !== -1) {
              keywordStart = nodeWithLocation.start + ifIndex;
              keywordEnd = keywordStart + 2;
            }
          }
          
          // ReturnStatement - extract "return"
          else if (node.type === 'ReturnStatement') {
            keyword = 'return';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const returnIndex = nodeStartCode.indexOf('return');
            if (returnIndex !== -1) {
              keywordStart = nodeWithLocation.start + returnIndex;
              keywordEnd = keywordStart + 6;
            }
          }
          
          // FunctionDeclaration/FunctionExpression with async - extract "async"
          else if (
            (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') &&
            (node as FunctionDeclaration | FunctionExpression).async
          ) {
            keyword = 'async';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const asyncIndex = nodeStartCode.indexOf('async');
            if (asyncIndex !== -1) {
              keywordStart = nodeWithLocation.start + asyncIndex;
              keywordEnd = keywordStart + 5;
            }
          }
          
          // AwaitExpression - extract "await"
          else if (node.type === 'AwaitExpression') {
            keyword = 'await';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const awaitIndex = nodeStartCode.indexOf('await');
            if (awaitIndex !== -1) {
              keywordStart = nodeWithLocation.start + awaitIndex;
              keywordEnd = keywordStart + 5;
            }
          }
          
          // ForStatement - extract "for"
          else if (node.type === 'ForStatement') {
            keyword = 'for';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const forIndex = nodeStartCode.indexOf('for');
            if (forIndex !== -1) {
              keywordStart = nodeWithLocation.start + forIndex;
              keywordEnd = keywordStart + 3;
            }
          }
          
          // WhileStatement - extract "while"
          else if (node.type === 'WhileStatement') {
            keyword = 'while';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const whileIndex = nodeStartCode.indexOf('while');
            if (whileIndex !== -1) {
              keywordStart = nodeWithLocation.start + whileIndex;
              keywordEnd = keywordStart + 5;
            }
          }
          
          // DoWhileStatement - extract "do"
          else if (node.type === 'DoWhileStatement') {
            keyword = 'do';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const doIndex = nodeStartCode.indexOf('do');
            if (doIndex !== -1) {
              keywordStart = nodeWithLocation.start + doIndex;
              keywordEnd = keywordStart + 2;
            }
          }
          
          // SwitchStatement - extract "switch"
          else if (node.type === 'SwitchStatement') {
            keyword = 'switch';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const switchIndex = nodeStartCode.indexOf('switch');
            if (switchIndex !== -1) {
              keywordStart = nodeWithLocation.start + switchIndex;
              keywordEnd = keywordStart + 6;
            }
          }
          
          // TryStatement - extract "try"
          else if (node.type === 'TryStatement') {
            keyword = 'try';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const tryIndex = nodeStartCode.indexOf('try');
            if (tryIndex !== -1) {
              keywordStart = nodeWithLocation.start + tryIndex;
              keywordEnd = keywordStart + 3;
            }
          }
          
          // ThrowStatement - extract "throw"
          else if (node.type === 'ThrowStatement') {
            keyword = 'throw';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const throwIndex = nodeStartCode.indexOf('throw');
            if (throwIndex !== -1) {
              keywordStart = nodeWithLocation.start + throwIndex;
              keywordEnd = keywordStart + 5;
            }
          }
          
          // BreakStatement - extract "break"
          else if (node.type === 'BreakStatement') {
            keyword = 'break';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const breakIndex = nodeStartCode.indexOf('break');
            if (breakIndex !== -1) {
              keywordStart = nodeWithLocation.start + breakIndex;
              keywordEnd = keywordStart + 5;
            }
          }
          
          // ContinueStatement - extract "continue"
          else if (node.type === 'ContinueStatement') {
            keyword = 'continue';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const continueIndex = nodeStartCode.indexOf('continue');
            if (continueIndex !== -1) {
              keywordStart = nodeWithLocation.start + continueIndex;
              keywordEnd = keywordStart + 8;
            }
          }
          
          // If we found a keyword, add it to eligible nodes
          if (keyword && keywordStart !== undefined && keywordEnd !== undefined) {
            if (!shouldExcludeNode(keyword, settings)) {
              eligibleNodes.push({
                start: keywordStart,
                end: keywordEnd,
                answer: keyword,
              });
            }
          }
        }
      }
    },
    });
    
    console.log('[DEBUG] collectAllEligibleNodes - traverse completed, found:', eligibleNodes.length);
  } catch (traverseError) {
    console.error('[DEBUG] collectAllEligibleNodes - traverse failed');
    console.error('[DEBUG] Traverse error:', JSON.stringify({
      message: traverseError instanceof Error ? traverseError.message : String(traverseError),
      stack: traverseError instanceof Error ? traverseError.stack : undefined
    }, null, 2));
    throw traverseError;
  }

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
