import { addGap } from '../generateGaps';
import { isShortValue } from '../gapRules';

export function arrayElementVisitor(gaps: any[], idRef: { current: number }, hardMode: boolean, _code: string) {
  return function ArrayExpression(node: any) {
    for (const element of node.elements) {
      if (element && element.type === 'Literal' && !isShortValue(String(element.value), hardMode)) {
        addGap(gaps, element.start, element.end, String(element.value), 'arrayElement', element.type, idRef.current++);
      }
      if (element && element.type === 'Identifier' && !isShortValue(element.name, hardMode)) {
        addGap(gaps, element.start, element.end, element.name, 'arrayElement', element.type, idRef.current++);
      }
    }
  };
} 