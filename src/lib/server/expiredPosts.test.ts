import { describe, it, expect } from 'vitest';
import { isMatchStartedKst, kstDateString, needsCleanup, planCleanup } from './expiredPosts';

// 2026-10-21 10:00 KST = 01:00 UTC
const now = new Date('2026-10-21T01:00:00Z');
const post = {
  id: 'p1',
  title: '풋살',
  date: '2026-10-21',
  time: '09:00',
  status: 'open' as const,
  applicantIds: [] as string[],
  acceptedCount: 0,
};

describe('kstDateString', () => {
  it('UTC 자정 전후에도 한국 날짜를 반환한다', () => {
    expect(kstDateString(new Date('2026-10-20T16:00:00Z'))).toBe('2026-10-21'); // KST 01:00
    expect(kstDateString(new Date('2026-10-20T14:00:00Z'))).toBe('2026-10-20'); // KST 23:00
  });

  it('날짜를 앞뒤로 이동한다', () => {
    expect(kstDateString(now, -3)).toBe('2026-10-18');
  });
});

describe('isMatchStartedKst', () => {
  it('경기 시작 시각을 한국 시간으로 비교한다', () => {
    expect(isMatchStartedKst('2026-10-21', '09:00', now)).toBe(true);
    expect(isMatchStartedKst('2026-10-21', '11:00', now)).toBe(false);
  });

  it('시간이 없으면 그날 23:59로 본다', () => {
    expect(isMatchStartedKst('2026-10-21', '', now)).toBe(false);
    expect(isMatchStartedKst('2026-10-20', '', now)).toBe(true);
  });

  it('형식이 잘못된 날짜는 시작 전으로 본다', () => {
    expect(isMatchStartedKst('잘못된날짜', '09:00', now)).toBe(false);
  });
});

describe('needsCleanup', () => {
  it('경기 시간이 지난 open 글은 정리 대상', () => {
    expect(needsCleanup(post, now)).toBe(true);
  });

  it('경기 전인 글은 대상이 아니다', () => {
    expect(needsCleanup({ ...post, time: '20:00' }, now)).toBe(false);
  });

  it('마감됐지만 대기 신청이 남은 글은 대상', () => {
    expect(needsCleanup({ ...post, status: 'closed', applicantIds: ['u1', 'u2'], acceptedCount: 1 }, now)).toBe(true);
  });

  it('마감됐고 대기 신청이 없는 글은 대상이 아니다', () => {
    expect(needsCleanup({ ...post, status: 'closed', applicantIds: ['u1'], acceptedCount: 1 }, now)).toBe(false);
  });
});

describe('planCleanup', () => {
  it('open 글만 마감 쓰기를 포함한다', () => {
    expect(planCleanup(post, []).closePost).toBe(true);
    expect(planCleanup({ ...post, status: 'closed' }, []).closePost).toBe(false);
  });
});
