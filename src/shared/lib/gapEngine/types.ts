/**
 * Segment-based gap representation
 */
export type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'gap'; id: number; answer: string };
