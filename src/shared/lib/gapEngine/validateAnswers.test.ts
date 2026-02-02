import { describe, it, expect } from 'vitest';
import { validateAnswers } from './validateAnswers';

describe('validateAnswers', () => {
  it('returns all correct when user answers match answerKey', () => {
    const answerKey: Record<number, string> = { 0: 'foo', 1: 'bar' };
    const userAnswers: Record<number, string> = { 0: 'foo', 1: 'bar' };
    const result = validateAnswers(answerKey, userAnswers);
    expect(result.correctCount).toBe(2);
    expect(result.totalCount).toBe(2);
    expect(result.correctGaps).toEqual([0, 1]);
    expect(result.incorrectGaps).toEqual([]);
    expect(result.hint).toBe('Perfect! All answers are correct.');
  });

  it('marks mismatched answers as incorrect', () => {
    const answerKey: Record<number, string> = { 0: 'foo', 1: 'bar' };
    const userAnswers: Record<number, string> = { 0: 'foo', 1: 'wrong' };
    const result = validateAnswers(answerKey, userAnswers);
    expect(result.correctCount).toBe(1);
    expect(result.totalCount).toBe(2);
    expect(result.correctGaps).toEqual([0]);
    expect(result.incorrectGaps).toEqual([1]);
    expect(result.hint).toBe('Almost there! Review your last answer.');
  });

  it('normalizes whitespace via trim when comparing', () => {
    const answerKey: Record<number, string> = { 0: 'foo' };
    const userAnswers: Record<number, string> = { 0: '  foo  ' };
    const result = validateAnswers(answerKey, userAnswers);
    expect(result.correctCount).toBe(1);
    expect(result.correctGaps).toEqual([0]);
  });

  it('treats missing user answer as neither correct nor incorrect', () => {
    const answerKey: Record<number, string> = { 0: 'foo', 1: 'bar' };
    const userAnswers: Record<number, string> = { 0: 'foo' };
    const result = validateAnswers(answerKey, userAnswers);
    expect(result.correctCount).toBe(1);
    expect(result.totalCount).toBe(2);
    expect(result.correctGaps).toEqual([0]);
    expect(result.incorrectGaps).toEqual([]);
    expect(result.hint).toBe('Fill in all the gaps to continue.');
  });

  it('treats empty user answer as neither correct nor incorrect', () => {
    const answerKey: Record<number, string> = { 0: 'foo' };
    const userAnswers: Record<number, string> = { 0: '' };
    const result = validateAnswers(answerKey, userAnswers);
    expect(result.correctCount).toBe(0);
    expect(result.incorrectGaps).toEqual([]);
    expect(result.hint).toBe('Try again! Review the code structure.');
  });

  it('returns zero total and empty arrays when answerKey is empty', () => {
    const result = validateAnswers({}, {});
    expect(result.correctCount).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.correctGaps).toEqual([]);
    expect(result.incorrectGaps).toEqual([]);
    expect(result.hint).toBe('Perfect! All answers are correct.');
  });

  it('hint is "Try again" when all provided answers are wrong', () => {
    const answerKey: Record<number, string> = { 0: 'foo', 1: 'bar' };
    const userAnswers: Record<number, string> = { 0: 'a', 1: 'b' };
    const result = validateAnswers(answerKey, userAnswers);
    expect(result.correctCount).toBe(0);
    expect(result.incorrectGaps).toEqual([0, 1]);
    expect(result.hint).toBe('Try again! Review the code structure.');
  });
});
