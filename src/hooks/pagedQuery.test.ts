import { describe, it, expect } from 'vitest';
import {
  applyLocalRead,
  clearsListOnError,
  computeHasMore,
  mergePages,
  shouldKeepPreviousHead,
} from './pagedQuery';

describe('computeHasMore', () => {
  const base = { pageSize: 20, headCount: 20, anchored: false, tailExhausted: false };

  it('고정 전에는 첫 페이지가 꽉 찼을 때만 더 있다', () => {
    expect(computeHasMore(base)).toBe(true);
    expect(computeHasMore({ ...base, headCount: 7 })).toBe(false);
  });

  it('고정 후에는 마지막으로 받은 페이지가 꽉 찼는지로 판단한다', () => {
    expect(computeHasMore({ ...base, anchored: true, tailExhausted: false })).toBe(true);
    expect(computeHasMore({ ...base, anchored: true, tailExhausted: true })).toBe(false);
  });

  it('고정 후에는 실시간 구간에 새 문서가 늘어도 영향을 받지 않는다', () => {
    expect(computeHasMore({ ...base, headCount: 25, anchored: true, tailExhausted: true })).toBe(false);
  });
});

describe('mergePages', () => {
  it('실시간 구간 뒤에 이전 페이지를 붙인다', () => {
    expect(mergePages([{ id: 'a' }, { id: 'b' }], [{ id: 'c' }]).map((d) => d.id)).toEqual(['a', 'b', 'c']);
  });

  it('이어 받은 구간 안에서 같은 페이지가 두 번 붙어도 한 번만 남긴다', () => {
    const page = [{ id: 'c' }, { id: 'd' }];
    expect(mergePages([{ id: 'a' }], [...page, ...page]).map((d) => d.id)).toEqual(['a', 'c', 'd']);
  });

  it('겹치는 문서는 실시간 구간의 것을 남긴다', () => {
    const merged = mergePages([{ id: 'a', v: 2 }], [{ id: 'a', v: 1 }, { id: 'b', v: 1 }]);
    expect(merged).toEqual([{ id: 'a', v: 2 }, { id: 'b', v: 1 }]);
  });
});

describe('shouldKeepPreviousHead', () => {
  const base = { anchored: true, fromCache: true, serverSeen: false, nextCount: 10, prevCount: 20 };

  it('고정 후 다시 연 구독의 첫 캐시 결과가 기존보다 적으면 기존 목록을 유지한다', () => {
    expect(shouldKeepPreviousHead(base)).toBe(true);
  });

  it('서버 결과는 적더라도 그대로 반영한다 (실제로 지워진 경우)', () => {
    expect(shouldKeepPreviousHead({ ...base, fromCache: false })).toBe(false);
  });

  it('서버 결과를 한 번 받은 뒤의 캐시 결과는 그대로 반영한다', () => {
    expect(shouldKeepPreviousHead({ ...base, serverSeen: true })).toBe(false);
  });

  it('캐시 결과가 기존보다 적지 않으면 반영한다', () => {
    expect(shouldKeepPreviousHead({ ...base, nextCount: 20 })).toBe(false);
  });

  it('고정 전 첫 구독은 해당하지 않는다', () => {
    expect(shouldKeepPreviousHead({ ...base, anchored: false })).toBe(false);
  });
});

describe('clearsListOnError', () => {
  it('권한 오류면 목록을 비운다', () => {
    expect(clearsListOnError('permission-denied')).toBe(true);
  });

  it('일시적인 오류는 마지막 목록을 유지한다', () => {
    expect(clearsListOnError('unavailable')).toBe(false);
  });
});

describe('applyLocalRead', () => {
  const items = [
    { id: 'a', isRead: false },
    { id: 'b', isRead: false },
    { id: 'c', isRead: true },
  ];

  it('화면에서 읽음 처리한 항목만 읽음으로 바꾼다', () => {
    expect(applyLocalRead(items, new Set(['a'])).map((i) => i.isRead)).toEqual([true, false, true]);
  });

  it('읽음 처리한 항목이 없으면 원본을 그대로 돌려준다', () => {
    expect(applyLocalRead(items, new Set())).toBe(items);
  });
});
