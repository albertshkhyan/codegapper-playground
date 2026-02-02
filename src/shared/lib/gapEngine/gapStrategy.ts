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

type NodeWithLocation = Node & {
  start?: number;
  end?: number;
};

function shuffleArray<T>(array: T[], random: () => number = Math.random): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function collectAllEligibleNodes(
  ast: Node,
  originalCode: string,
  settings: GapSettings
): EligibleNode[] {
  const eligibleNodes: EligibleNode[] = [];

  traverse(ast, {
    enter(node: Node) {
      if (
        settings.nodeTypes.properties &&
        node.type === 'MemberExpression' &&
        node.property.type === 'Identifier'
      ) {
        const memberExpr = node as MemberExpression;
        const propertyNode = memberExpr.property as NodeWithLocation;
        
        if (propertyNode.start !== undefined && propertyNode.end !== undefined) {
          const answer = originalCode.substring(propertyNode.start, propertyNode.end);
          
          if (!shouldExcludeNode(answer, settings)) {
            eligibleNodes.push({
              start: propertyNode.start,
              end: propertyNode.end,
              answer,
            });
          }
        }
      }

      if (
        settings.nodeTypes.functions &&
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier'
      ) {
        const callExpr = node as CallExpression;
        const calleeNode = callExpr.callee as NodeWithLocation;
        
        if (calleeNode.start !== undefined && calleeNode.end !== undefined) {
          const answer = originalCode.substring(calleeNode.start, calleeNode.end);
          
          if (!shouldExcludeNode(answer, settings)) {
            eligibleNodes.push({
              start: calleeNode.start,
              end: calleeNode.end,
              answer,
            });
          }
        }
      }

      if (settings.nodeTypes.operators) {
        if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
          const expr = node as BinaryExpression | LogicalExpression;
          const operator = expr.operator;
          
          // Find operator position in source code
          // The operator is between left.end and right.start
          const leftNode = expr.left as NodeWithLocation;
          const rightNode = expr.right as NodeWithLocation;
          
          if (leftNode.end !== undefined && rightNode.start !== undefined) {
            const betweenCode = originalCode.substring(leftNode.end, rightNode.start);
            const trimmedBetween = betweenCode.trim();
            const operatorIndex = trimmedBetween.indexOf(operator);
            
            if (operatorIndex !== -1) {
              const leadingWhitespace = betweenCode.length - betweenCode.trimStart().length;
              const operatorStart = leftNode.end + leadingWhitespace + operatorIndex;
              const operatorEnd = operatorStart + operator.length;
              
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

      if (settings.nodeTypes.variables) {
        if (
          node.type === 'ArrowFunctionExpression' ||
          node.type === 'FunctionExpression' ||
          node.type === 'FunctionDeclaration'
        ) {
          const funcNode = node as ArrowFunctionExpression | FunctionExpression | FunctionDeclaration;
          
          if (funcNode.params && Array.isArray(funcNode.params)) {
            funcNode.params.forEach((param) => {
              if (param.type === 'Identifier') {
                const paramNode = param as NodeWithLocation;
                
                if (paramNode.start !== undefined && paramNode.end !== undefined) {
                  const answer = originalCode.substring(paramNode.start, paramNode.end);
                  
                  if (!shouldExcludeNode(answer, settings)) {
                    eligibleNodes.push({
                      start: paramNode.start,
                      end: paramNode.end,
                      answer,
                    });
                  }
                }
              }
            });
          }
        }
      }

      if (settings.nodeTypes.keywords) {
        const nodeWithLocation = node as NodeWithLocation;
        
        if (nodeWithLocation.start !== undefined) {
          let keyword: string | null = null;
          let keywordStart: number | undefined;
          let keywordEnd: number | undefined;
          
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
          
          else if (node.type === 'ReturnStatement') {
            keyword = 'return';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const returnIndex = nodeStartCode.indexOf('return');
            if (returnIndex !== -1) {
              keywordStart = nodeWithLocation.start + returnIndex;
              keywordEnd = keywordStart + 6;
            }
          }
          
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
          
          else if (node.type === 'SwitchStatement') {
            keyword = 'switch';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const switchIndex = nodeStartCode.indexOf('switch');
            if (switchIndex !== -1) {
              keywordStart = nodeWithLocation.start + switchIndex;
              keywordEnd = keywordStart + 6;
            }
          }
          
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
          
          else if (node.type === 'BreakStatement') {
            keyword = 'break';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const breakIndex = nodeStartCode.indexOf('break');
            if (breakIndex !== -1) {
              keywordStart = nodeWithLocation.start + breakIndex;
              keywordEnd = keywordStart + 5;
            }
          }
          
          else if (node.type === 'ContinueStatement') {
            keyword = 'continue';
            const nodeStartCode = originalCode.substring(nodeWithLocation.start, nodeWithLocation.start + 10);
            const continueIndex = nodeStartCode.indexOf('continue');
            if (continueIndex !== -1) {
              keywordStart = nodeWithLocation.start + continueIndex;
              keywordEnd = keywordStart + 8;
            }
          }
          
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

  return eligibleNodes;
}

export function selectRandomGapNodes(
  eligibleNodes: EligibleNode[],
  settings: GapSettings,
  random: () => number = Math.random
): GapNode[] {
  if (eligibleNodes.length === 0) {
    return [];
  }

  const shuffled = shuffleArray(eligibleNodes, random);
  const targetCount = calculateTargetGapCount(eligibleNodes.length, settings, random);
  const selected = shuffled.slice(0, targetCount);
  selected.sort((a, b) => a.start - b.start);
  
  return selected.map((node, index) => ({
    ...node,
    id: index + 1,
  }));
}
