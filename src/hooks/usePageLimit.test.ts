import { describe, it, expect } from 'vitest';
import { hasMorePages } from './usePageLimit';

describe('hasMorePages', () => {
  it('limit만큼 받아오면 다음 페이지가 있을 수 있다', () => {
    expect(hasMorePages(20, 20)).toBe(true);
  });

  it('limit보다 적게 받아오면 마지막 페이지', () => {
    expect(hasMorePages(7, 20)).toBe(false);
    expect(hasMorePages(0, 20)).toBe(false);
  });
});
