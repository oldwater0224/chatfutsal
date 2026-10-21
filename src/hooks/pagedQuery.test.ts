import { describe, it, expect } from 'vitest';
import { computeHasMore, mergePages } from './pagedQuery';

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

  it('겹치는 문서는 실시간 구간의 것을 남긴다', () => {
    const merged = mergePages([{ id: 'a', v: 2 }], [{ id: 'a', v: 1 }, { id: 'b', v: 1 }]);
    expect(merged).toEqual([{ id: 'a', v: 2 }, { id: 'b', v: 1 }]);
  });
});
