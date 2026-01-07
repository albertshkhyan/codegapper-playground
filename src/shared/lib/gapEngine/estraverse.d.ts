declare module 'estraverse' {
  export interface Visitor {
    enter?: (node: any, parent?: any) => void | 'skip';
    leave?: (node: any, parent?: any) => void | 'skip';
  }

  export function traverse(ast: any, visitor: Visitor): void;
  export function replace(ast: any, visitor: Visitor): any;
}
