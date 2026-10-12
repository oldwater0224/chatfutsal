import { describe, it, expect, vi, afterEach } from 'vitest';
import { isPostExpired, getTodayString, formatMatchDate } from './dateUtils';

describe('isPostExpired', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('과거 날짜+시간이면 만료', () => {
    vi.useFakeTimers({ now: new Date('2026-10-11T15:00:00') });
    expect(isPostExpired('2026-10-11', '14:00')).toBe(true);
  });

  it('미래 날짜+시간이면 미만료', () => {
    vi.useFakeTimers({ now: new Date('2026-10-11T13:00:00') });
    expect(isPostExpired('2026-10-11', '14:00')).toBe(false);
  });

  it('정확히 같은 시간이면 만료', () => {
    vi.useFakeTimers({ now: new Date('2026-10-11T14:00:00') });
    expect(isPostExpired('2026-10-11', '14:00')).toBe(true);
  });

  it('시간 미지정 시 23:59 기준 — 이전이면 미만료', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 11, 23, 58, 0) });
    expect(isPostExpired('2026-10-11', '')).toBe(false);
  });

  it('시간 미지정 시 23:59 기준 — 도달하면 만료', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 11, 23, 59, 0) });
    expect(isPostExpired('2026-10-11', '')).toBe(true);
  });

  it('미래 날짜면 시간 무관 미만료', () => {
    vi.useFakeTimers({ now: new Date('2026-10-11T23:59:00') });
    expect(isPostExpired('2026-10-12', '08:00')).toBe(false);
  });
});

describe('getTodayString', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('YYYY-MM-DD 포맷 반환', () => {
    vi.useFakeTimers({ now: new Date('2026-03-05T10:00:00') });
    expect(getTodayString()).toBe('2026-03-05');
  });

  it('로컬 자정 직후에도 UTC 전날이 아닌 로컬 날짜 반환', () => {
    vi.useFakeTimers({ now: new Date(2026, 2, 5, 0, 30, 0) });
    expect(getTodayString()).toBe('2026-03-05');
  });
});

describe('formatMatchDate', () => {
  it('M월 D일 (요일) 포맷 반환', () => {
    expect(formatMatchDate('2026-10-11')).toBe('10월 11일 (일)');
    expect(formatMatchDate('2026-10-17')).toBe('10월 17일 (토)');
  });

  it('잘못된 문자열은 그대로 반환', () => {
    expect(formatMatchDate('')).toBe('');
    expect(formatMatchDate('미정')).toBe('미정');
  });
});
