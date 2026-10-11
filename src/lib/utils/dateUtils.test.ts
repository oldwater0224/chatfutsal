import { describe, it, expect, vi, afterEach } from 'vitest';
import { isPostExpired, getTodayString } from './dateUtils';

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
});
