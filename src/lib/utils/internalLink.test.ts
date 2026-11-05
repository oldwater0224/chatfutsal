import { describe, it, expect } from 'vitest';
import { isInternalPath } from './internalLink';

describe('isInternalPath', () => {
  it('앱 내부 경로는 허용한다', () => {
    expect(isInternalPath('/chat/r1')).toBe(true);
    expect(isInternalPath('/notifications')).toBe(true);
    expect(isInternalPath('/recruit/abc?tab=1#top')).toBe(true);
    expect(isInternalPath('/')).toBe(true);
    expect(isInternalPath('/chat/r1?x=1#y')).toBe(true);
  });

  it('다른 출처로 해석되는 경로는 막는다', () => {
    expect(isInternalPath('https://evil.com')).toBe(false);
    expect(isInternalPath('//evil.com')).toBe(false);
    expect(isInternalPath('/\\evil.com')).toBe(false);
    expect(isInternalPath('javascript:alert(1)')).toBe(false);
    expect(isInternalPath('chat/r1')).toBe(false);
    expect(isInternalPath('')).toBe(false);
  });

  it('URL 파서가 지우는 제어 문자로 우회하지 못한다', () => {
    expect(isInternalPath('/\t/evil.com')).toBe(false);
    expect(isInternalPath('/\n/evil.com')).toBe(false);
    expect(isInternalPath('/\r/evil.com')).toBe(false);
    expect(isInternalPath('/\u0000/evil.com')).toBe(false);
    expect(isInternalPath('/\u007F/evil.com')).toBe(false);
  });

  it('정규화 후 경로가 "//"로 시작하면 막는다', () => {
    expect(isInternalPath('/.//evil.com')).toBe(false);
    expect(isInternalPath('/..//evil.com')).toBe(false);
  });

  it('앞뒤 공백이 있으면 막는다', () => {
    expect(isInternalPath(' /x')).toBe(false);
    expect(isInternalPath('/x ')).toBe(false);
    expect(isInternalPath(' //evil.com')).toBe(false);
  });

  it('문자열이 아니면 false', () => {
    expect(isInternalPath(undefined)).toBe(false);
    expect(isInternalPath(null)).toBe(false);
    expect(isInternalPath(123)).toBe(false);
    expect(isInternalPath({ toString: () => '/chat/r1' })).toBe(false);
  });
});
