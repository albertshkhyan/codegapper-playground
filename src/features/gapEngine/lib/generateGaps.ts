import { parse } from 'acorn';
import * as acornWalk from 'acorn-walk';
import * as esutils from 'esutils';
import { isTrivialName, isAllowedMethodName, isShortValue } from './gapRules';
import { GAP_TYPE_MAPPING, matchesUIGapTypes, getAllMappedGapTypes } from './gapTypeMapping';

export type GapType = string;

export interface Gap {
  start: number;
  end: number;
  original: string;
  id: string;
  type: GapType;
  nodeType: string;
}

function isValidIdentifier(name: string) {
  return !isTrivialName(name) && !esutils.keyword.isReservedWordES6(name, 6);
}

export function addGap(gaps: Gap[], start: number, end: number, original: string, type: GapType, nodeType: string, id: number) {
  gaps.push({ start, end, original, id: `gap-${id}`, type, nodeType });
}

const RECENT_HISTORY_SIZE = 10;
// Per-code history: Map<codeHash, { gapCombinations: Set<string>, typePatterns: Set<string> }>
interface CodeHistory {
  gapCombinations: Set<string>;
  typePatterns: Set<string>;
}
const codeHistory: Map<string, CodeHistory> = new Map();

/**
 * Generate a simple hash from code string for history tracking.
 * This ensures history is scoped per code sample.
 */
function getCodeHash(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Get or create history for a specific code hash.
 */
function getHistoryForCode(codeHash: string): CodeHistory {
  if (!codeHistory.has(codeHash)) {
    codeHistory.set(codeHash, {
      gapCombinations: new Set(),
      typePatterns: new Set()
    });
  }
  return codeHistory.get(codeHash)!;
}

/**
 * Generate a type pattern key from gaps (e.g., "identifier:2,literal:1").
 * This helps avoid similar type distributions even with different gap IDs.
 */
function getTypePatternKey(gaps: Gap[]): string {
  const typeCounts = gaps.reduce((acc, gap) => {
    acc[gap.type] = (acc[gap.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Sort by type name for consistent ordering, then format as "type:count"
  return Object.entries(typeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, count]) => `${type}:${count}`)
    .join(',');
}

/**
 * Selects gaps with diversity in mind - prefers gaps from different types
 * when multiple types are available.
 */
function selectDiverseGaps(gaps: Gap[], maxGaps: number): Gap[] {
  if (gaps.length <= maxGaps) {
    return gaps;
  }

  // Group gaps by type
  const gapsByType: Record<string, Gap[]> = {};
  for (const gap of gaps) {
    if (!gapsByType[gap.type]) {
      gapsByType[gap.type] = [];
    }
    gapsByType[gap.type].push(gap);
  }

  const availableTypes = Object.keys(gapsByType);
  const selected: Gap[] = [];
  const selectedTypes = new Set<string>();
  const remainingGaps = [...gaps];

  // First pass: select one gap from each type (up to maxGaps)
  for (const type of availableTypes) {
    if (selected.length >= maxGaps) break;
    
    const typeGaps = gapsByType[type];
    if (typeGaps.length > 0) {
      // Randomly select one gap from this type
      const randomIdx = Math.floor(Math.random() * typeGaps.length);
      const selectedGap = typeGaps[randomIdx];
      selected.push(selectedGap);
      selectedTypes.add(type);
      
      // Remove selected gap from remaining gaps
      const remainingIdx = remainingGaps.findIndex(g => g.id === selectedGap.id);
      if (remainingIdx !== -1) {
        remainingGaps.splice(remainingIdx, 1);
      }
    }
  }

  // Second pass: fill remaining slots randomly from all remaining gaps
  while (selected.length < maxGaps && remainingGaps.length > 0) {
    const randomIdx = Math.floor(Math.random() * remainingGaps.length);
    selected.push(remainingGaps[randomIdx]);
    remainingGaps.splice(randomIdx, 1);
  }

  // Shuffle the final selection for random order
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

export function generateGaps(
  code: string,
  _allowedTypes?: GapType[],
  maxGaps: number = 5,
  hardMode: boolean = false
): Gap[] {
  // Generate code hash for per-code history tracking
  const codeHash = getCodeHash(code);
  const recentGapSets = getHistoryForCode(codeHash);
  
  let id = 0;
  const gaps: Gap[] = [];
  let ast: any;
  try {
    ast = parse(code, {
      sourceType: 'module',
      ecmaVersion: 'latest',
      locations: true
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[generateGaps] Parse error:', e);
    return [];
  }
  const codeLines = code.split('\n');
  const lineStartIndices: number[] = [];
  let idx = 0;
  for (const line of codeLines) {
    lineStartIndices.push(idx);
    idx += line.length + 1; // +1 for the newline
  }
  function getLineNumber(pos: number) {
    for (let i = lineStartIndices.length - 1; i >= 0; i--) {
      if (pos >= lineStartIndices[i]) return i;
    }
    return 0;
  }
  // Visitors for acorn-walk
  const visitors: acornWalk.AncestorVisitors<any> = {
    Identifier(node: any) {
      if (isValidIdentifier(node.name) && !isShortValue(node.name, hardMode)) {
        addGap(gaps, node.start, node.end, node.name, 'identifier', node.type, id++);
      }
    },
    Literal(node: any) {
      if ('value' in node && node.value !== undefined) {
        const val = String(node.value);
        if (!isShortValue(val, hardMode)) {
          addGap(gaps, node.start, node.end, val, 'literal', node.type, id++);
        }
      }
    },
    // Merge logic for object keys and object shorthand properties
    Property(node: any) {
      // Object key gap
      if (node.key && node.key.type === 'Identifier') {
        const name = node.key.name;
        if (isValidIdentifier(name) && !isShortValue(name, hardMode)) {
          addGap(gaps, node.key.start, node.key.end, name, 'objectKey', node.type, id++);
        }
      }
      // Object shorthand property gap
      if (node.shorthand && node.key && node.key.type === 'Identifier' && isValidIdentifier(node.key.name) && !isShortValue(node.key.name, hardMode)) {
        addGap(gaps, node.key.start, node.key.end, node.key.name, 'objectShorthand', node.key.type, id++);
      }
    },
    MemberExpression(node: any, _state: any, ancestors: any[]) {
      // Dot notation property access
      if (node.property && node.property.type === 'Identifier') {
        const name = node.property.name;
        if (isAllowedMethodName(name) && isValidIdentifier(name) && !isShortValue(name, hardMode)) {
          addGap(gaps, node.property.start, node.property.end, name, 'propertyAccess', node.type, id++);
          // Check if this MemberExpression is the callee of a CallExpression
          const parent = ancestors[ancestors.length - 2];
          if (parent && parent.type === 'CallExpression' && parent.callee === node) {
            addGap(gaps, node.property.start, node.property.end, name, 'methodName', node.type, id++);
          }
        }
      }
      // Bracket notation property access
      if (node.computed && node.property && node.property.type === 'Literal') {
        const val = String(node.property.value);
        if (!isShortValue(val, hardMode)) {
          addGap(gaps, node.property.start, node.property.end, val, 'bracketProperty', node.property.type, id++);
        }
      }
    },
    FunctionDeclaration(node: any) {
      for (const param of node.params) {
        if (param.type === 'Identifier') {
          if (isValidIdentifier(param.name) && !isShortValue(param.name, hardMode)) {
            addGap(gaps, param.start, param.end, param.name, 'functionParam', param.type, id++);
          }
        }
        if (param.type === 'ObjectPattern') {
          for (const prop of param.properties) {
            if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier') {
              const dname = prop.key.name;
              if (isValidIdentifier(dname) && !isShortValue(dname, hardMode)) {
                addGap(gaps, prop.key.start, prop.key.end, dname, 'destructuredParam', prop.key.type, id++);
              }
            }
          }
        }
      }
    },
    FunctionExpression(node: any) {
      for (const param of node.params) {
        if (param.type === 'Identifier') {
          if (isValidIdentifier(param.name) && !isShortValue(param.name, hardMode)) {
            addGap(gaps, param.start, param.end, param.name, 'functionParam', param.type, id++);
          }
        }
        if (param.type === 'ObjectPattern') {
          for (const prop of param.properties) {
            if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier') {
              const dname = prop.key.name;
              if (isValidIdentifier(dname) && !isShortValue(dname, hardMode)) {
                addGap(gaps, prop.key.start, prop.key.end, dname, 'destructuredParam', prop.key.type, id++);
              }
            }
          }
        }
      }
    },
    ArrowFunctionExpression(node: any) {
      for (const param of node.params) {
        if (param.type === 'Identifier') {
          if (isValidIdentifier(param.name) && !isShortValue(param.name, hardMode)) {
            addGap(gaps, param.start, param.end, param.name, 'functionParam', param.type, id++);
          }
        }
        if (param.type === 'ObjectPattern') {
          for (const prop of param.properties) {
            if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier') {
              const dname = prop.key.name;
              if (isValidIdentifier(dname) && !isShortValue(dname, hardMode)) {
                addGap(gaps, prop.key.start, prop.key.end, dname, 'destructuredParam', prop.key.type, id++);
              }
            }
          }
        }
      }
    },
    // Add gaps for array elements
    ArrayExpression(node: any) {
      for (const element of node.elements) {
        if (element && element.type === 'Literal' && !isShortValue(String(element.value), hardMode)) {
          addGap(gaps, element.start, element.end, String(element.value), 'arrayElement', element.type, id++);
        }
        if (element && element.type === 'Identifier' && isValidIdentifier(element.name) && !isShortValue(element.name, hardMode)) {
          addGap(gaps, element.start, element.end, element.name, 'arrayElement', element.type, id++);
        }
      }
    },
    // Add gaps for object values
    ObjectExpression(node: any) {
      for (const prop of node.properties) {
        if (prop.type === 'Property' && prop.value) {
          if (prop.value.type === 'Literal' && !isShortValue(String(prop.value.value), hardMode)) {
            addGap(gaps, prop.value.start, prop.value.end, String(prop.value.value), 'objectValue', prop.value.type, id++);
          }
          if (prop.value.type === 'Identifier' && isValidIdentifier(prop.value.name) && !isShortValue(prop.value.name, hardMode)) {
            addGap(gaps, prop.value.start, prop.value.end, prop.value.name, 'objectValue', prop.value.type, id++);
          }
        }
      }
    },
    // Add gaps for default parameter values
    AssignmentPattern(node: any) {
      if (node.right) {
        if (node.right.type === 'Literal' && !isShortValue(String(node.right.value), hardMode)) {
          addGap(gaps, node.right.start, node.right.end, String(node.right.value), 'defaultParamValue', node.right.type, id++);
        }
        if (node.right.type === 'Identifier' && isValidIdentifier(node.right.name) && !isShortValue(node.right.name, hardMode)) {
          addGap(gaps, node.right.start, node.right.end, node.right.name, 'defaultParamValue', node.right.type, id++);
        }
      }
    },
    // Add gaps for import/export specifiers
    ImportSpecifier(node: any) {
      if (node.imported && node.imported.type === 'Identifier' && isValidIdentifier(node.imported.name) && !isShortValue(node.imported.name, hardMode)) {
        addGap(gaps, node.imported.start, node.imported.end, node.imported.name, 'importSpecifier', node.imported.type, id++);
      }
    },
    ExportSpecifier(node: any) {
      if (node.exported && node.exported.type === 'Identifier' && isValidIdentifier(node.exported.name) && !isShortValue(node.exported.name, hardMode)) {
        addGap(gaps, node.exported.start, node.exported.end, node.exported.name, 'exportSpecifier', node.exported.type, id++);
      }
    },
    // Add gaps for destructured assignment targets
    VariableDeclarator(node: any) {
      if (node.id && node.id.type === 'ObjectPattern') {
        for (const prop of node.id.properties) {
          if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier') {
            const dname = prop.key.name;
            if (isValidIdentifier(dname) && !isShortValue(dname, hardMode)) {
              addGap(gaps, prop.key.start, prop.key.end, dname, 'destructuredTarget', prop.key.type, id++);
            }
          }
        }
      }
    },
    // Add gaps for return expressions in more contexts
    ReturnStatement(node: any) {
      const arg = node.argument;
      if (arg && arg.start != null && arg.end != null) {
        const codeSlice = code.slice(arg.start, arg.end);
        if (!isShortValue(codeSlice, hardMode)) {
          addGap(gaps, arg.start, arg.end, codeSlice, 'returnExpr', node.type, id++);
        }
      }
    },
    ObjectPattern(node: any) {
      for (const prop of node.properties) {
        if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier') {
          const dname = prop.key.name;
          if (isValidIdentifier(dname) && !isShortValue(dname, hardMode)) {
            addGap(gaps, prop.key.start, prop.key.end, dname, 'destructuredVar', prop.key.type, id++);
          }
        }
      }
    },
    // Merge logic for update expressions (argument and expression)
    UpdateExpression(node: any) {
      if (node.argument && node.argument.type === 'Identifier' && isValidIdentifier(node.argument.name) && !isShortValue(node.argument.name, hardMode)) {
        addGap(gaps, node.argument.start, node.argument.end, node.argument.name, 'updateArgument', node.argument.type, id++);
      }
      // Also add gap for the full expression (existing logic)
      const exprStart = node.start;
      const exprEnd = node.end;
      const exprSlice = code.slice(exprStart, exprEnd);
      const lineNum = getLineNumber(exprStart);
      const lineStart = lineStartIndices[lineNum];
      const lineEnd = lineStart + codeLines[lineNum].length;
      if (!(exprStart === lineStart && exprEnd === lineEnd) && !isShortValue(exprSlice, hardMode)) {
        addGap(gaps, exprStart, exprEnd, exprSlice, 'expression', node.type, id++);
      }
    },
    // Merge logic for assignment expressions (operator and expression)
    AssignmentExpression(node: any) {
      if (node.operator && typeof node.operator === 'string') {
        const opStart = node.left.end;
        const opEnd = node.right.start;
        if (!isShortValue(node.operator, hardMode)) {
          addGap(gaps, opStart, opEnd, node.operator, 'assignmentOperator', node.type, id++);
        }
      }
      // Also add gap for the full expression (existing logic)
      const exprStart = node.start;
      const exprEnd = node.end;
      const exprSlice = code.slice(exprStart, exprEnd);
      const lineNum = getLineNumber(exprStart);
      const lineStart = lineStartIndices[lineNum];
      const lineEnd = lineStart + codeLines[lineNum].length;
      if (!(exprStart === lineStart && exprEnd === lineEnd) && !isShortValue(exprSlice, hardMode)) {
        addGap(gaps, exprStart, exprEnd, exprSlice, 'expression', node.type, id++);
      }
    },
    // Add gaps for template literal expressions (embedded expressions)
    TemplateLiteral(node: any) {
      for (const expr of node.expressions) {
        if (expr && expr.start != null && expr.end != null) {
          const exprCode = code.slice(expr.start, expr.end);
          if (!isShortValue(exprCode, hardMode)) {
            addGap(gaps, expr.start, expr.end, exprCode, 'templateExpr', expr.type, id++);
          }
        }
      }
    },
    // Control flow keywords (hard mode only)
    IfStatement(node: any) {
      if (hardMode && node.start != null && node.end != null) {
        const keyword = code.slice(node.start, node.start + 2); // 'if'
        addGap(gaps, node.start, node.start + keyword.length, keyword, 'controlKeyword', node.type, id++);
      }
    },
    ForStatement(node: any) {
      if (hardMode && node.start != null && node.end != null) {
        const keyword = code.slice(node.start, node.start + 3); // 'for'
        addGap(gaps, node.start, node.start + keyword.length, keyword, 'controlKeyword', node.type, id++);
      }
    },
    WhileStatement(node: any) {
      if (hardMode && node.start != null && node.end != null) {
        const keyword = code.slice(node.start, node.start + 5); // 'while'
        addGap(gaps, node.start, node.start + keyword.length, keyword, 'controlKeyword', node.type, id++);
      }
    },
    SwitchStatement(node: any) {
      if (hardMode && node.start != null && node.end != null) {
        const keyword = code.slice(node.start, node.start + 6); // 'switch'
        addGap(gaps, node.start, node.start + keyword.length, keyword, 'controlKeyword', node.type, id++);
      }
    },
    BreakStatement(node: any) {
      if (hardMode && node.start != null && node.end != null) {
        const keyword = code.slice(node.start, node.start + 5); // 'break'
        addGap(gaps, node.start, node.start + keyword.length, keyword, 'controlKeyword', node.type, id++);
      }
    },
    ContinueStatement(node: any) {
      if (hardMode && node.start != null && node.end != null) {
        const keyword = code.slice(node.start, node.start + 8); // 'continue'
        addGap(gaps, node.start, node.start + keyword.length, keyword, 'controlKeyword', node.type, id++);
      }
    },
    DoWhileStatement(node: any) {
      if (hardMode && node.start != null && node.end != null) {
        const keyword = code.slice(node.start, node.start + 2); // 'do'
        addGap(gaps, node.start, node.start + keyword.length, keyword, 'controlKeyword', node.type, id++);
      }
    },
    ForInStatement(node: any) {
      if (hardMode && node.start != null && node.end != null) {
        const keyword = code.slice(node.start, node.start + 6); // 'for in'
        addGap(gaps, node.start, node.start + keyword.length, keyword, 'controlKeyword', node.type, id++);
      }
    },
    ForOfStatement(node: any) {
      if (hardMode && node.start != null && node.end != null) {
        const keyword = code.slice(node.start, node.start + 6); // 'for of'
        addGap(gaps, node.start, node.start + keyword.length, keyword, 'controlKeyword', node.type, id++);
      }
    },
    SwitchCase(node: any) {
      if (hardMode && node.start != null && node.end != null) {
        const keyword = code.slice(node.start, node.start + 4); // 'case'
        addGap(gaps, node.start, node.start + keyword.length, keyword, 'controlKeyword', node.type, id++);
      }
    },
    // Add gaps for unary expressions (operator and argument)
    UnaryExpression(node: any) {
      if (node.operator && typeof node.operator === 'string' && node.argument && node.argument.type === 'Identifier') {
        if (!isShortValue(node.operator, hardMode)) {
          addGap(gaps, node.start, node.start + node.operator.length, node.operator, 'unaryOperator', node.type, id++);
        }
        if (isValidIdentifier(node.argument.name) && !isShortValue(node.argument.name, hardMode)) {
          addGap(gaps, node.argument.start, node.argument.end, node.argument.name, 'unaryArgument', node.argument.type, id++);
        }
      }
    },
    // Add gaps for binary/logical operators
    BinaryExpression(node: any) {
      if (node.operator && typeof node.operator === 'string') {
        const opStart = node.left.end;
        const opEnd = node.right.start;
        if (!isShortValue(node.operator, hardMode)) {
          addGap(gaps, opStart, opEnd, node.operator, 'binaryOperator', node.type, id++);
        }
      }
    },
    LogicalExpression(node: any) {
      if (node.operator && typeof node.operator === 'string') {
        const opStart = node.left.end;
        const opEnd = node.right.start;
        if (!isShortValue(node.operator, hardMode)) {
          addGap(gaps, opStart, opEnd, node.operator, 'logicalOperator', node.type, id++);
        }
      }
    },
    // Add gaps for conditional (ternary) expressions
    ConditionalExpression(node: any) {
      if (node.test && node.test.start != null && node.test.end != null) {
        const testCode = code.slice(node.test.start, node.test.end);
        if (!isShortValue(testCode, hardMode)) {
          addGap(gaps, node.test.start, node.test.end, testCode, 'ternaryTest', node.test.type, id++);
        }
      }
      if (node.consequent && node.consequent.start != null && node.consequent.end != null) {
        const consCode = code.slice(node.consequent.start, node.consequent.end);
        if (!isShortValue(consCode, hardMode)) {
          addGap(gaps, node.consequent.start, node.consequent.end, consCode, 'ternaryConsequent', node.consequent.type, id++);
        }
      }
      if (node.alternate && node.alternate.start != null && node.alternate.end != null) {
        const altCode = code.slice(node.alternate.start, node.alternate.end);
        if (!isShortValue(altCode, hardMode)) {
          addGap(gaps, node.alternate.start, node.alternate.end, altCode, 'ternaryAlternate', node.alternate.type, id++);
        }
      }
    },
    // Add gaps for call expression arguments
    CallExpression(node: any) {
      for (const arg of node.arguments) {
        if (arg.type === 'Identifier' && isValidIdentifier(arg.name) && !isShortValue(arg.name, hardMode)) {
          addGap(gaps, arg.start, arg.end, arg.name, 'callArgument', arg.type, id++);
        }
        if (arg.type === 'Literal' && !isShortValue(String(arg.value), hardMode)) {
          addGap(gaps, arg.start, arg.end, String(arg.value), 'callArgument', arg.type, id++);
        }
      }
      // Existing logic for function call identifiers
      if (
        node.callee &&
        node.callee.type === 'Identifier' &&
        isAllowedMethodName(node.callee.name) &&
        isValidIdentifier(node.callee.name) &&
        !isShortValue(node.callee.name, hardMode)
      ) {
        addGap(gaps, node.callee.start, node.callee.end, node.callee.name, 'functionCall', node.callee.type, id++);
      }
      // Explicit method call gap (obj.method())
      if (
        node.callee &&
        node.callee.type === 'MemberExpression' &&
        node.callee.property &&
        node.callee.property.type === 'Identifier' &&
        isAllowedMethodName(node.callee.property.name) &&
        isValidIdentifier(node.callee.property.name) &&
        !isShortValue(node.callee.property.name, hardMode)
      ) {
        addGap(gaps, node.callee.property.start, node.callee.property.end, node.callee.property.name, 'methodCall', node.callee.property.type, id++);
      }
    },
    // Add gaps for spread/rest elements
    SpreadElement(node: any) {
      if (node.argument && node.argument.type === 'Identifier' && isValidIdentifier(node.argument.name) && !isShortValue(node.argument.name, hardMode)) {
        addGap(gaps, node.argument.start, node.argument.end, node.argument.name, 'spreadElement', node.argument.type, id++);
      }
    },
    RestElement(node: any) {
      if (node.argument && node.argument.type === 'Identifier' && isValidIdentifier(node.argument.name) && !isShortValue(node.argument.name, hardMode)) {
        addGap(gaps, node.argument.start, node.argument.end, node.argument.name, 'restElement', node.argument.type, id++);
      }
    },
    // Add gaps for new expressions (constructor calls)
    NewExpression(node: any) {
      if (node.callee && node.callee.type === 'Identifier' && isValidIdentifier(node.callee.name) && !isShortValue(node.callee.name, hardMode)) {
        addGap(gaps, node.callee.start, node.callee.end, node.callee.name, 'constructorCall', node.callee.type, id++);
      }
    },
    // Add gaps for tagged template expressions (tag identifier)
    TaggedTemplateExpression(node: any) {
      if (node.tag && node.tag.type === 'Identifier' && isValidIdentifier(node.tag.name) && !isShortValue(node.tag.name, hardMode)) {
        addGap(gaps, node.tag.start, node.tag.end, node.tag.name, 'taggedTemplateTag', node.tag.type, id++);
      }
    },
    // Add gaps for await/yield expressions (argument)
    AwaitExpression(node: any) {
      if (node.argument && node.argument.type === 'Identifier' && isValidIdentifier(node.argument.name) && !isShortValue(node.argument.name, hardMode)) {
        addGap(gaps, node.argument.start, node.argument.end, node.argument.name, 'awaitArgument', node.argument.type, id++);
      }
    },
    YieldExpression(node: any) {
      if (node.argument && node.argument.type === 'Identifier' && isValidIdentifier(node.argument.name) && !isShortValue(node.argument.name, hardMode)) {
        addGap(gaps, node.argument.start, node.argument.end, node.argument.name, 'yieldArgument', node.argument.type, id++);
      }
    },
    // Add gaps for class method/property names
    MethodDefinition(node: any) {
      if (node.key && node.key.type === 'Identifier' && isValidIdentifier(node.key.name) && !isShortValue(node.key.name, hardMode)) {
        addGap(gaps, node.key.start, node.key.end, node.key.name, 'classMethodOrProperty', node.key.type, id++);
      }
    },
    // Add gaps for import/export default/namespace specifiers
    ImportDefaultSpecifier(node: any) {
      if (node.local && node.local.type === 'Identifier' && isValidIdentifier(node.local.name) && !isShortValue(node.local.name, hardMode)) {
        addGap(gaps, node.local.start, node.local.end, node.local.name, 'importDefault', node.local.type, id++);
      }
    },
    ImportNamespaceSpecifier(node: any) {
      if (node.local && node.local.type === 'Identifier' && isValidIdentifier(node.local.name) && !isShortValue(node.local.name, hardMode)) {
        addGap(gaps, node.local.start, node.local.end, node.local.name, 'importNamespace', node.local.type, id++);
      }
    },
    ExportDefaultDeclaration(node: any) {
      if (node.declaration && node.declaration.type === 'Identifier' && isValidIdentifier(node.declaration.name) && !isShortValue(node.declaration.name, hardMode)) {
        addGap(gaps, node.declaration.start, node.declaration.end, node.declaration.name, 'exportDefault', node.declaration.type, id++);
      }
    },
  };
  acornWalk.ancestor(ast, visitors);
  // eslint-disable-next-line no-console
  console.debug('[generateGaps] Initial gaps:', gaps);
  // eslint-disable-next-line no-console
  console.log('[DEBUG] Total gaps generated:', JSON.stringify(gaps.length));
  // eslint-disable-next-line no-console
  console.log('[DEBUG] Gap types breakdown:', JSON.stringify(gaps.reduce((acc, gap) => {
    acc[gap.type] = (acc[gap.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>), null, 2));
  
  // Filter gaps by allowed types if provided
  // Uses gapTypeMapping config for type filtering
  let filteredGaps = gaps;
  // Only filter if we have a non-empty array (empty array means use user selections, not "all types")
  if (_allowedTypes && Array.isArray(_allowedTypes) && _allowedTypes.length > 0) {
    // eslint-disable-next-line no-console
    console.log('[DEBUG] Filtering gaps - Requested UI types:', JSON.stringify(_allowedTypes, null, 2));
    
    // eslint-disable-next-line no-console
    console.log('[DEBUG] Type mapping:', JSON.stringify(Object.keys(GAP_TYPE_MAPPING).map(uiType => ({
      uiType,
      mappedTypes: GAP_TYPE_MAPPING[uiType].mappedTypes,
      description: GAP_TYPE_MAPPING[uiType].description,
      count: gaps.filter(g => GAP_TYPE_MAPPING[uiType].mappedTypes.includes(g.type)).length
    })), null, 2));
    
    const beforeFilterCount = gaps.length;
    filteredGaps = gaps.filter(gap => matchesUIGapTypes(gap.type, _allowedTypes));
    
    // eslint-disable-next-line no-console
    console.log('[DEBUG] Filtering results:', JSON.stringify({
      before: beforeFilterCount,
      after: filteredGaps.length,
      removed: beforeFilterCount - filteredGaps.length,
      filteredGapTypes: filteredGaps.reduce((acc, gap) => {
        acc[gap.type] = (acc[gap.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }, null, 2));
  } else {
    // eslint-disable-next-line no-console
    console.log('[DEBUG] No filtering - all gap types allowed');
    // eslint-disable-next-line no-console
    console.log('[DEBUG] _allowedTypes was:', JSON.stringify(_allowedTypes, null, 2));
  }
  
  // Deduplicate gaps for the same value on the same line and ensure no two gaps are adjacent
  // But preserve at least one gap per selected type
  const gapsByLine: Record<number, Gap[]> = {};
  const preservedGapsByType: Record<string, Gap> = {}; // Track at least one gap per selected type
  
  // Get all gap types that correspond to selected UI types (if any)
  const selectedGapTypes = _allowedTypes && _allowedTypes.length > 0 
    ? getAllMappedGapTypes(_allowedTypes)
    : [];
  
  // First pass: normal deduplication
  for (const gap of filteredGaps) {
    const line = getLineNumber(gap.start);
    if (!gapsByLine[line]) gapsByLine[line] = [];
    // Only consider it a duplicate if it's the exact same gap (same start position AND same original)
    const isDuplicate = gapsByLine[line].some(g => g.original === gap.original && g.start === gap.start && g.end === gap.end);
    // Check if gap is too close to any existing gap on the same line (within 2 characters)
    const isTooClose = gapsByLine[line].some(g => {
      const distanceAfter = gap.start - g.end; // Gap comes after existing gap
      const distanceBefore = g.start - gap.end; // Gap comes before existing gap
      const overlaps = !(gap.end <= g.start || gap.start >= g.end);
      return overlaps || (distanceAfter >= 0 && distanceAfter < 2) || (distanceBefore >= 0 && distanceBefore < 2);
    });
    if (!isDuplicate && !isTooClose && gapsByLine[line].length < 2) {
      gapsByLine[line].push(gap);
      // Track this gap as preserved for its type (if it's a selected type)
      if (selectedGapTypes.length > 0 && selectedGapTypes.includes(gap.type)) {
        if (!preservedGapsByType[gap.type]) {
          preservedGapsByType[gap.type] = gap;
        }
      }
    }
  }
  let limitedGaps = Object.values(gapsByLine).flat();
  
  // Second pass: ensure at least one gap per selected type is preserved
  if (selectedGapTypes.length > 0) {
    const missingTypes: string[] = [];
    for (const gapType of selectedGapTypes) {
      // Check if this type exists in filtered gaps but not in limited gaps
      const hasGapInFiltered = filteredGaps.some(g => g.type === gapType);
      const hasGapInLimited = limitedGaps.some(g => g.type === gapType);
      
      if (hasGapInFiltered && !hasGapInLimited) {
        missingTypes.push(gapType);
      }
    }
    
    // For each missing type, find and add at least one gap (relaxing spacing rules if needed)
    for (const missingType of missingTypes) {
      const gapsOfType = filteredGaps.filter(g => g.type === missingType);
      if (gapsOfType.length > 0) {
        // Try to find a gap that can fit without conflicts
        let added = false;
        for (const gap of gapsOfType) {
          const line = getLineNumber(gap.start);
          if (!gapsByLine[line]) gapsByLine[line] = [];
          
          // Check if it's a duplicate
          const isDuplicate = gapsByLine[line].some(g => g.original === gap.original && g.start === gap.start && g.end === gap.end);
          if (isDuplicate) continue;
          
          // If line has space, add it
          if (gapsByLine[line].length < 2) {
            gapsByLine[line].push(gap);
            preservedGapsByType[missingType] = gap;
            added = true;
            break;
          }
        }
        
        // If we couldn't add it normally, force add the first gap (even if it violates spacing)
        if (!added && gapsOfType.length > 0) {
          const gapToAdd = gapsOfType[0];
          const line = getLineNumber(gapToAdd.start);
          if (!gapsByLine[line]) gapsByLine[line] = [];
          
          // Check if it's a duplicate
          const isDuplicate = gapsByLine[line].some(g => g.original === gapToAdd.original && g.start === gapToAdd.start && g.end === gapToAdd.end);
          if (!isDuplicate) {
            // Force add even if line is full or too close (remove one existing gap if line is full)
            if (gapsByLine[line].length >= 2) {
              // Remove the last gap to make room
              gapsByLine[line].pop();
            }
            gapsByLine[line].push(gapToAdd);
            preservedGapsByType[missingType] = gapToAdd;
          }
        }
      }
    }
    
    // Rebuild limitedGaps after adding missing types
    limitedGaps = Object.values(gapsByLine).flat();
  }
  
  // eslint-disable-next-line no-console
  console.log('[DEBUG] Limited gaps before randomization:', JSON.stringify({
    count: limitedGaps.length,
    gaps: limitedGaps.map(g => ({ id: g.id, type: g.type, original: g.original, start: g.start, end: g.end }))
  }, null, 2));
  // eslint-disable-next-line no-console
  console.debug('[generateGaps] After deduplication/spacing:', limitedGaps);
  const byTypeAfterDedup = limitedGaps.reduce((acc, gap) => {
    acc[gap.type] = (acc[gap.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  // eslint-disable-next-line no-console
  console.log('[DEBUG] After deduplication/spacing:', JSON.stringify({
    count: limitedGaps.length,
    byType: byTypeAfterDedup,
    preservedTypes: selectedGapTypes.length > 0 ? {
      selectedTypes: selectedGapTypes,
      preservedTypes: Object.keys(preservedGapsByType),
      missingTypes: selectedGapTypes.filter(t => !preservedGapsByType[t] && filteredGaps.some(g => g.type === t))
    } : null
  }, null, 2));
  let shuffled: Gap[] = [];
  let result: Gap[] = [];
  
  // If we have fewer or equal gaps than maxGaps, return all gaps directly (no randomization needed)
  if (limitedGaps.length <= maxGaps) {
    // eslint-disable-next-line no-console
    console.log('[DEBUG] Fewer gaps than maxGaps - returning all gaps:', JSON.stringify({
      limitedGapsCount: limitedGaps.length,
      maxGaps,
      reason: 'No randomization needed - returning all available gaps'
    }, null, 2));
    // Still shuffle for random order, but return all
    shuffled = [...limitedGaps];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    result = shuffled;
  } else {
    // We have more gaps than maxGaps, so we need to randomly select and track history
    let attempts = 0;
    let foundNew = false;
    const allCombos = [];
    
    // eslint-disable-next-line no-console
    console.log('[DEBUG] Randomization start:', JSON.stringify({
      codeHash,
      limitedGapsCount: limitedGaps.length,
      maxGaps,
      gapCombinationsSize: recentGapSets.gapCombinations.size,
      typePatternsSize: recentGapSets.typePatterns.size,
      gapCombinations: Array.from(recentGapSets.gapCombinations),
      typePatterns: Array.from(recentGapSets.typePatterns),
      possibleCombinations: Math.min(limitedGaps.length, maxGaps) > 0 
        ? Math.floor(limitedGaps.length / maxGaps) 
        : 0
    }, null, 2));
    
    while (attempts < 10 && !foundNew && limitedGaps.length > 0) {
      // Use diversity-aware selection to prefer gaps from different types
      const candidate = selectDiverseGaps(limitedGaps, maxGaps);
      const candidateKey = candidate.map(g => g.id).sort().join(',');
      const typePatternKey = getTypePatternKey(candidate);
      allCombos.push(candidateKey);
      
      // Check if this combination is new (both gap IDs and type pattern)
      const isNewGapCombination = !recentGapSets.gapCombinations.has(candidateKey);
      const isNewTypePattern = !recentGapSets.typePatterns.has(typePatternKey);
      const isNew = isNewGapCombination || isNewTypePattern;
      
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Randomization attempt:', JSON.stringify({
        attempt: attempts + 1,
        candidateKey,
        typePatternKey,
        isNewGapCombination,
        isNewTypePattern,
        isNew,
        candidate: candidate.map(g => ({ id: g.id, type: g.type, original: g.original })),
        diversity: {
          uniqueTypes: new Set(candidate.map(g => g.type)).size,
          typeBreakdown: candidate.reduce((acc, gap) => {
            acc[gap.type] = (acc[gap.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      }, null, 2));
      
      if (isNew) {
        result = candidate;
        foundNew = true;
        
        // Add both keys to history
        if (isNewGapCombination) {
          recentGapSets.gapCombinations.add(candidateKey);
          if (recentGapSets.gapCombinations.size > RECENT_HISTORY_SIZE) {
            // Keep only the most recent entries
            const entries = Array.from(recentGapSets.gapCombinations);
            recentGapSets.gapCombinations.clear();
            entries.slice(-RECENT_HISTORY_SIZE).forEach(key => recentGapSets.gapCombinations.add(key));
          }
        }
        
        if (isNewTypePattern) {
          recentGapSets.typePatterns.add(typePatternKey);
          if (recentGapSets.typePatterns.size > RECENT_HISTORY_SIZE) {
            // Keep only the most recent entries
            const entries = Array.from(recentGapSets.typePatterns);
            recentGapSets.typePatterns.clear();
            entries.slice(-RECENT_HISTORY_SIZE).forEach(key => recentGapSets.typePatterns.add(key));
          }
        }
      }
      attempts++;
    }
    
    if (!foundNew && limitedGaps.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('[generateGaps] All gap sets exhausted, resetting history for code:', codeHash);
      // eslint-disable-next-line no-console
      console.log('[DEBUG] All combinations tried:', JSON.stringify({
        codeHash,
        uniqueCombinations: [...new Set(allCombos)],
        totalAttempts: allCombos.length,
        allCombos
      }, null, 2));
      // Clear both history types
      recentGapSets.gapCombinations.clear();
      recentGapSets.typePatterns.clear();
      // Use diversity-aware selection for fallback
      result = selectDiverseGaps(limitedGaps, maxGaps);
      const candidateKey = result.map(g => g.id).sort().join(',');
      const typePatternKey = getTypePatternKey(result);
      recentGapSets.gapCombinations.add(candidateKey);
      recentGapSets.typePatterns.add(typePatternKey);
    }
  }
  if (result.length === 0 && limitedGaps.length > 0) {
    // eslint-disable-next-line no-console
    console.warn('[generateGaps] No gaps after filtering, returning a random available gap as fallback');
    const randomIdx = Math.floor(Math.random() * limitedGaps.length);
    result = [limitedGaps[randomIdx]];
  }
  // eslint-disable-next-line no-console
  console.debug('[generateGaps] Final result:', result);
  const typeBreakdown = result.reduce((acc, gap) => {
    acc[gap.type] = (acc[gap.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  // eslint-disable-next-line no-console
  console.log('[DEBUG] Final gaps returned:', JSON.stringify({
    count: result.length,
    maxGaps,
    gaps: result.map(g => ({ id: g.id, type: g.type, original: g.original })),
    byType: typeBreakdown,
    diversity: {
      uniqueTypes: Object.keys(typeBreakdown).length,
      maxTypeCount: Math.max(...Object.values(typeBreakdown), 0),
      isDiverse: Object.keys(typeBreakdown).length > 1
    }
  }, null, 2));
  return result;
} 