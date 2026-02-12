import type { Segment } from '../shared/lib/gapEngine/types';
import type { GapSettings } from '../shared/lib/gapEngine/settings';
import { defaultGapSettings } from '../shared/lib/gapEngine/settings';
import type { SessionData } from './sessionStorage';

/** Partial session as in an imported JSON file. Most fields optional except name, inputCode, segments, answerKey. */
export interface SessionImportItem {
  name: string;
  inputCode: string;
  segments: Segment[];
  /** Gap id -> correct answer. Keys may be string or number in JSON. */
  answerKey: Record<string, string> | Record<number, string>;
  id?: string;
  groupName?: string;
  order?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  userAnswers?: Record<string, string> | Record<number, string>;
  gapSettings?: Partial<GapSettings>;
}

/** Multi-session import payload (optional groups, array of sessions). */
export interface SessionImportPayload {
  version?: number;
  exportedAt?: string;
  groups?: string[];
  sessions: SessionImportItem[];
}

/** Single session import (root is one session object). */
export type SingleSessionImport = SessionImportItem;

/** Supported import schema version. Unknown versions produce a warning. */
export const IMPORT_SCHEMA_VERSION = 1;

/** Minimal valid single-session JSON example for UI (expected format help). */
export const IMPORT_JSON_EXAMPLE = `{
  "name": "My Session",
  "groupName": "Tutorials",
  "notes": "Optional description",
  "inputCode": "function add(a, b) {\\n  return a + b;\\n}",
  "segments": [
    { "kind": "text", "value": "function " },
    { "kind": "gap", "id": 0, "answer": "add" },
    { "kind": "text", "value": "(a, b) {\\n  return a + b;\\n}" }
  ],
  "answerKey": { "0": "add" }
}`;

/** Multi-session format example (snippet for UI). */
export const IMPORT_JSON_MULTI_EXAMPLE = `{
  "version": 1,
  "sessions": [
    { "name": "Session 1", "inputCode": "...", "segments": [...], "answerKey": {} },
    { "name": "Session 2", "groupName": "Group A", "inputCode": "...", "segments": [...], "answerKey": {} }
  ]
}`;

export interface ValidSessionPreview {
  session: SessionData;
  /** Final name after duplicate resolution (may differ from session.name). */
  displayName: string;
}

export interface SessionValidationError {
  index: number;
  /** Original name from JSON if present. */
  name?: string;
  errors: string[];
}

export interface ImportValidationResult {
  /** Set when JSON parse or root format fails. */
  parseError?: string;
  /** Set when payload has version > IMPORT_SCHEMA_VERSION. */
  versionWarning?: string;
  validSessions: ValidSessionPreview[];
  errors: SessionValidationError[];
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function normalizeAnswerKey(
  raw: Record<string, string> | Record<number, string> | undefined
): Record<number, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<number, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const num = Number(k);
    if (Number.isInteger(num) && typeof v === 'string') out[num] = v;
  }
  return out;
}

function deepMergeGapSettings(partial: Partial<GapSettings> | undefined): GapSettings {
  if (!partial || typeof partial !== 'object') return defaultGapSettings;
  return {
    ...defaultGapSettings,
    ...partial,
    nodeTypes: {
      ...defaultGapSettings.nodeTypes,
      ...(partial.nodeTypes ?? {}),
      literals: {
        ...defaultGapSettings.nodeTypes.literals,
        ...(partial.nodeTypes?.literals ?? {}),
      },
    },
    exclusions: {
      ...defaultGapSettings.exclusions,
      ...(partial.exclusions ?? {}),
      customList: Array.isArray(partial.exclusions?.customList)
        ? partial.exclusions.customList
        : defaultGapSettings.exclusions.customList,
    },
  };
}

function isValidSegment(seg: unknown): seg is Segment {
  if (!seg || typeof seg !== 'object') return false;
  const s = seg as Record<string, unknown>;
  if (s.kind === 'text') return typeof s.value === 'string';
  if (s.kind === 'gap') return typeof s.id === 'number' && typeof s.answer === 'string';
  return false;
}

function normalizeSegment(seg: unknown): Segment | null {
  if (!isValidSegment(seg)) return null;
  if (seg.kind === 'text') return { kind: 'text', value: seg.value };
  return { kind: 'gap', id: Number(seg.id), answer: String(seg.answer) };
}

/**
 * Normalizes a single import item into SessionData.
 * Generates id and timestamps if missing; merges gapSettings with defaults.
 */
export function normalizeSessionImport(item: SessionImportItem): SessionData {
  const now = new Date().toISOString();
  const segments = Array.isArray(item.segments)
    ? item.segments.map(normalizeSegment).filter((s): s is Segment => s !== null)
    : [];
  const answerKey = normalizeAnswerKey(item.answerKey);
  const userAnswers = normalizeAnswerKey(item.userAnswers);
  const gapSettings = deepMergeGapSettings(item.gapSettings);

  return {
    id: generateSessionId(),
    name: typeof item.name === 'string' ? item.name.trim() || 'Imported Session' : 'Imported Session',
    groupName: typeof item.groupName === 'string' ? item.groupName.trim() || undefined : undefined,
    order: typeof item.order === 'number' && Number.isInteger(item.order) ? item.order : undefined,
    notes: typeof item.notes === 'string' ? item.notes : undefined,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : now,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : now,
    inputCode: typeof item.inputCode === 'string' ? item.inputCode : '',
    segments,
    answerKey,
    userAnswers,
    gapSettings,
  };
}

function isSessionImportItem(raw: unknown): raw is SessionImportItem {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return (
    typeof o.name === 'string' &&
    typeof o.inputCode === 'string' &&
    Array.isArray(o.segments) &&
    typeof o.answerKey === 'object' &&
    o.answerKey !== null
  );
}

/**
 * Validates a single import item and returns a list of error messages.
 * Empty array means valid.
 */
export function validateSessionImportItem(item: unknown, _index: number): string[] {
  const errors: string[] = [];
  if (!item || typeof item !== 'object') {
    return ['Not an object'];
  }
  const o = item as Record<string, unknown>;

  if (typeof o.name !== 'string') {
    errors.push('Missing or invalid "name" (must be a string)');
  }
  if (typeof o.inputCode !== 'string') {
    errors.push('Missing or invalid "inputCode" (must be a string)');
  }
  if (!Array.isArray(o.segments)) {
    errors.push('Missing or invalid "segments" (must be an array)');
  } else {
    o.segments.forEach((seg: unknown, i: number) => {
      if (!isValidSegment(seg)) {
        errors.push(`segments[${i}]: must be { kind: "text", value: string } or { kind: "gap", id: number, answer: string }`);
      }
    });
  }
  if (typeof o.answerKey !== 'object' || o.answerKey === null) {
    errors.push('Missing or invalid "answerKey" (must be an object with gap id keys and string values)');
  } else {
    const ak = o.answerKey as Record<string, unknown>;
    for (const [k, v] of Object.entries(ak)) {
      if (!Number.isInteger(Number(k)) || typeof v !== 'string') {
        errors.push('answerKey: each key must be a gap id (number) and each value must be a string');
        break;
      }
    }
  }
  return errors;
}

/** Resolves duplicate name by appending (2), (3), etc. */
function resolveDisplayName(name: string, existingNames: Set<string>): string {
  let display = name;
  let n = 2;
  while (existingNames.has(display)) {
    display = `${name} (${n})`;
    n += 1;
  }
  existingNames.add(display);
  return display;
}

/**
 * Parses JSON string or unknown payload into an array of SessionData.
 * Accepts: { sessions: SessionImportItem[] }, SessionImportItem[], or single SessionImportItem.
 */
export function parseSessionImport(json: string): { ok: true; sessions: SessionData[] } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(json) as unknown;
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }

  let items: SessionImportItem[];

  if (Array.isArray(data)) {
    items = data.filter(isSessionImportItem);
    if (items.length === 0)
      return { ok: false, error: 'No valid sessions in array. Each item needs name, inputCode, segments, and answerKey.' };
  } else if (data && typeof data === 'object' && 'sessions' in data && Array.isArray((data as SessionImportPayload).sessions)) {
    const payload = data as SessionImportPayload;
    items = payload.sessions.filter(isSessionImportItem);
    if (items.length === 0)
      return { ok: false, error: 'No valid sessions in payload. Each session needs name, inputCode, segments, and answerKey.' };
  } else if (isSessionImportItem(data)) {
    items = [data];
  } else {
    return { ok: false, error: 'Unsupported format. Use a single session object, an array of sessions, or { "sessions": [...] }.' };
  }

  const sessions = items.map(normalizeSessionImport);
  return { ok: true, sessions };
}

/**
 * Parses JSON and validates each session. Returns a validation result with
 * valid sessions (with duplicate names resolved) and per-item errors.
 * Pass existing session names to resolve duplicates (e.g. "Session" -> "Session (2)").
 */
export function parseSessionImportWithValidation(
  json: string,
  existingNames: string[] = []
): ImportValidationResult {
  let data: unknown;
  try {
    data = JSON.parse(json) as unknown;
  } catch {
    return { parseError: 'Invalid JSON', validSessions: [], errors: [] };
  }

  const usedNames = new Set<string>(existingNames);
  const validSessions: ValidSessionPreview[] = [];
  const errors: SessionValidationError[] = [];
  let versionWarning: string | undefined;

  let items: { raw: unknown; index: number }[] = [];

  if (Array.isArray(data)) {
    items = data.map((raw, index) => ({ raw, index }));
  } else if (data && typeof data === 'object' && 'sessions' in data && Array.isArray((data as SessionImportPayload).sessions)) {
    const payload = data as SessionImportPayload;
    if (typeof payload.version === 'number' && payload.version > IMPORT_SCHEMA_VERSION) {
      versionWarning = `Import format version ${payload.version} is newer than supported (${IMPORT_SCHEMA_VERSION}). Some fields may be ignored.`;
    }
    items = payload.sessions.map((raw, index) => ({ raw, index }));
  } else if (data && typeof data === 'object' && 'name' in data) {
    items = [{ raw: data, index: 0 }];
  } else {
    return {
      parseError: 'Unsupported format. Use a single session object, an array of sessions, or { "sessions": [...] }.',
      validSessions: [],
      errors: [],
    };
  }

  for (const { raw, index } of items) {
    const itemErrors = validateSessionImportItem(raw, index);
    if (itemErrors.length > 0) {
      const name = (raw as Record<string, unknown>)?.name;
      errors.push({
        index,
        name: typeof name === 'string' ? name : undefined,
        errors: itemErrors,
      });
      continue;
    }
    if (!isSessionImportItem(raw)) continue;
    const session = normalizeSessionImport(raw);
    const displayName = resolveDisplayName(session.name, usedNames);
    session.name = displayName;
    validSessions.push({ session, displayName });
  }

  return { versionWarning, validSessions, errors };
}
