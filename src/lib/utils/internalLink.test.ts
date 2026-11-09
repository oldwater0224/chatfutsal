import { describe, it, expect } from 'vitest';
import { isInternalPath, resolveNextPath } from './internalLink';

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

describe('resolveNextPath', () => {
  it('앱 내부 경로는 그대로 돌려준다', () => {
    expect(resolveNextPath('/recruit/abc')).toBe('/recruit/abc');
    expect(resolveNextPath('/users/x?tab=1')).toBe('/users/x?tab=1');
    expect(resolveNextPath('/loginhelp')).toBe('/loginhelp');
  });

  it('값이 없으면 "/"', () => {
    expect(resolveNextPath(null)).toBe('/');
    expect(resolveNextPath(undefined)).toBe('/');
    expect(resolveNextPath('')).toBe('/');
  });

  it('외부 주소는 "/"', () => {
    expect(resolveNextPath('//evil.com')).toBe('/');
    expect(resolveNextPath('https://evil.com')).toBe('/');
    expect(resolveNextPath('javascript:alert(1)')).toBe('/');
    expect(resolveNextPath('/\t/evil.com')).toBe('/');
  });

  it('로그인·가입·인증 경로로 되돌아가면 "/"', () => {
    expect(resolveNextPath('/login')).toBe('/');
    expect(resolveNextPath('/login?next=/x')).toBe('/');
    expect(resolveNextPath('/login/')).toBe('/');
    expect(resolveNextPath('/signup')).toBe('/');
    expect(resolveNextPath('/auth/kakao')).toBe('/');
    expect(resolveNextPath('/./login')).toBe('/');
    expect(resolveNextPath('/x/../signup')).toBe('/');
  });
});
