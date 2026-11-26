import { describe, it, expect } from 'vitest';
import { isInternalPath, resolveNextPath } from './internalLink';
import {
  ALLOWED_PATHS,
  CONTROL_CHAR_INPUTS,
  CROSS_ORIGIN_INPUTS,
  NON_STRING_INPUTS,
  NORMALIZATION_INPUTS,
  WHITESPACE_INPUTS,
} from './internalLink.cases';

describe('isInternalPath', () => {
  it('앱 내부 경로는 허용한다', () => {
    expect(ALLOWED_PATHS).toHaveLength(5);
    for (const link of ALLOWED_PATHS) expect(isInternalPath(link)).toBe(true);
  });

  it('다른 출처로 해석되는 경로는 막는다', () => {
    expect(CROSS_ORIGIN_INPUTS).toHaveLength(6);
    for (const link of CROSS_ORIGIN_INPUTS) expect(isInternalPath(link)).toBe(false);
  });

  it('URL 파서가 지우는 제어 문자로 우회하지 못한다', () => {
    expect(CONTROL_CHAR_INPUTS).toHaveLength(5);
    for (const link of CONTROL_CHAR_INPUTS) expect(isInternalPath(link)).toBe(false);
  });

  it('정규화 후 경로가 "//"로 시작하면 막는다', () => {
    expect(NORMALIZATION_INPUTS).toHaveLength(2);
    for (const link of NORMALIZATION_INPUTS) expect(isInternalPath(link)).toBe(false);
  });

  it('앞뒤 공백이 있으면 막는다', () => {
    expect(WHITESPACE_INPUTS).toHaveLength(3);
    for (const link of WHITESPACE_INPUTS) expect(isInternalPath(link)).toBe(false);
  });

  it('문자열이 아니면 false', () => {
    expect(NON_STRING_INPUTS).toHaveLength(4);
    for (const link of NON_STRING_INPUTS) expect(isInternalPath(link)).toBe(false);
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
