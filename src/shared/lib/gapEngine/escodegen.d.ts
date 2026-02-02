declare module 'escodegen' {
  import type { Node } from 'estree';

  export interface GenerateOptions {
    format?: {
      indent?: {
        style?: string;
      };
      newline?: string;
      quotes?: 'single' | 'double';
    };
  }

  export function generate(ast: Node, options?: GenerateOptions): string;
}
