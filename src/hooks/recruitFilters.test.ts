import { describe, it, expect } from 'vitest';
import { serverFilterConstraints } from './recruitFilters';

describe('serverFilterConstraints', () => {
  it('선택한 날짜·실력만 쿼리 조건으로 만든다', () => {
    expect(serverFilterConstraints({ date: '2026-10-30', level: 'amateur' })).toEqual([
      ['date', '2026-10-30'],
      ['level', 'amateur'],
    ]);
  });

  it('선택하지 않은 필터는 조건에 넣지 않는다', () => {
    expect(serverFilterConstraints({ date: '', level: 'pro' })).toEqual([['level', 'pro']]);
    expect(serverFilterConstraints({})).toEqual([]);
  });
});
