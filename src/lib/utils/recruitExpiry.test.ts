import { describe, it, expect, vi, afterEach } from 'vitest';
import { selectPostsToClose } from './recruitExpiry';

type Post = Parameters<typeof selectPostsToClose>[0][number];

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: 'p1',
    date: '2026-10-11',
    time: '14:00',
    status: 'open',
    ...overrides,
  };
}

describe('selectPostsToClose', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('경기 시간이 지난 open 글을 고른다', () => {
    vi.useFakeTimers({ now: new Date('2026-10-11T15:00:00') });
    expect(selectPostsToClose([post()], new Set())).toEqual(['p1']);
  });

  it('아직 시작 전인 글은 제외한다', () => {
    vi.useFakeTimers({ now: new Date('2026-10-11T13:00:00') });
    expect(selectPostsToClose([post()], new Set())).toEqual([]);
  });

  it('이미 마감된 글은 제외한다', () => {
    vi.useFakeTimers({ now: new Date('2026-10-11T15:00:00') });
    expect(selectPostsToClose([post({ status: 'closed' })], new Set())).toEqual([]);
  });

  it('이미 시도한 글은 제외한다', () => {
    vi.useFakeTimers({ now: new Date('2026-10-11T15:00:00') });
    expect(selectPostsToClose([post()], new Set(['p1']))).toEqual([]);
  });

  it('만료된 글만 골라 여러 건 반환한다', () => {
    vi.useFakeTimers({ now: new Date('2026-10-11T15:00:00') });
    const posts = [
      post({ id: 'expired1', time: '10:00' }),
      post({ id: 'future', time: '20:00' }),
      post({ id: 'expired2', time: '14:30' }),
      post({ id: 'alreadyClosed', time: '09:00', status: 'closed' }),
    ];
    expect(selectPostsToClose(posts, new Set())).toEqual(['expired1', 'expired2']);
  });

  it('시도 기록이 누적되면 같은 글을 다시 고르지 않는다', () => {
    vi.useFakeTimers({ now: new Date('2026-10-11T15:00:00') });
    const posts = [post({ id: 'a' }), post({ id: 'b' })];
    const attempted = new Set<string>();

    const first = selectPostsToClose(posts, attempted);
    expect(first).toEqual(['a', 'b']);
    first.forEach((id) => attempted.add(id));

    expect(selectPostsToClose(posts, attempted)).toEqual([]);
  });

  it('빈 목록이면 빈 배열', () => {
    vi.useFakeTimers({ now: new Date('2026-10-11T15:00:00') });
    expect(selectPostsToClose([], new Set())).toEqual([]);
  });

  it('time이 비면 23:59 기준 — 이전이면 제외', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 11, 23, 58, 0) });
    expect(selectPostsToClose([post({ time: '' })], new Set())).toEqual([]);
  });

  it('time이 비면 23:59 기준 — 도달하면 선택', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 11, 23, 59, 0) });
    expect(selectPostsToClose([post({ time: '' })], new Set())).toEqual(['p1']);
  });
});
