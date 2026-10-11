import { describe, it, expect } from 'vitest';

// Firebase 초기화를 우회하기 위해 순수 함수 로직을 직접 정의하여 테스트
function parseLeftAt(
  raw: Record<string, { toDate?: () => Date } | null> | undefined,
): Record<string, Date> {
  const result: Record<string, Date> = {};
  if (!raw) return result;
  Object.entries(raw).forEach(([uid, value]) => {
    result[uid] = value?.toDate ? value.toDate() : new Date();
  });
  return result;
}

function isHiddenForUser(
  leftAt: Record<string, Date> | undefined,
  lastMessageAt: Date,
  userId: string,
): boolean {
  const myLeftAt = leftAt?.[userId];
  return !!myLeftAt && lastMessageAt.getTime() <= myLeftAt.getTime();
}

describe('parseLeftAt', () => {
  it('undefined 입력 시 빈 객체 반환', () => {
    expect(parseLeftAt(undefined)).toEqual({});
  });

  it('toDate 메서드가 있는 Timestamp 변환', () => {
    const ts = new Date('2026-10-11T12:00:00');
    const raw = { user1: { toDate: () => ts } };
    expect(parseLeftAt(raw)).toEqual({ user1: ts });
  });

  it('null 값(serverTimestamp 미반영)은 현재 시간으로 간주', () => {
    const before = Date.now();
    const result = parseLeftAt({ user1: null });
    const after = Date.now();
    expect(result.user1.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.user1.getTime()).toBeLessThanOrEqual(after);
  });

  it('여러 유저 동시 처리', () => {
    const ts1 = new Date('2026-10-10T10:00:00');
    const ts2 = new Date('2026-10-11T11:00:00');
    const raw = {
      user1: { toDate: () => ts1 },
      user2: { toDate: () => ts2 },
    };
    const result = parseLeftAt(raw);
    expect(result.user1).toEqual(ts1);
    expect(result.user2).toEqual(ts2);
  });
});

describe('isHiddenForUser', () => {
  it('leftAt이 undefined면 숨기지 않음', () => {
    expect(isHiddenForUser(undefined, new Date(), 'user1')).toBe(false);
  });

  it('해당 유저가 leftAt에 없으면 숨기지 않음', () => {
    const leftAt = { user2: new Date('2026-10-11T10:00:00') };
    expect(isHiddenForUser(leftAt, new Date(), 'user1')).toBe(false);
  });

  it('나간 시점 이후에 메시지가 없으면 숨김', () => {
    const leftAt = { user1: new Date('2026-10-11T12:00:00') };
    const lastMsg = new Date('2026-10-11T11:00:00');
    expect(isHiddenForUser(leftAt, lastMsg, 'user1')).toBe(true);
  });

  it('나간 시점과 마지막 메시지가 같으면 숨김', () => {
    const t = new Date('2026-10-11T12:00:00');
    expect(isHiddenForUser({ user1: t }, t, 'user1')).toBe(true);
  });

  it('나간 이후 새 메시지가 있으면 다시 보임', () => {
    const leftAt = { user1: new Date('2026-10-11T12:00:00') };
    const lastMsg = new Date('2026-10-11T13:00:00');
    expect(isHiddenForUser(leftAt, lastMsg, 'user1')).toBe(false);
  });
});
