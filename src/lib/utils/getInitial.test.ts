import { describe, it, expect } from 'vitest';
import { firstCodePoint, getInitial } from './getInitial';

const isLoneSurrogate = (s: string) => /^[\uD800-\uDFFF]$/.test(s);

describe('getInitial', () => {
  it('한글 닉네임은 첫 글자를 돌려준다', () => {
    expect(getInitial('풋살왕')).toBe('풋');
  });

  it('영문 닉네임은 첫 글자를 그대로 돌려준다', () => {
    expect(getInitial('alice')).toBe('a');
    expect(getInitial('Bob')).toBe('B');
  });

  it('앞뒤 공백은 무시한다', () => {
    expect(getInitial('  민수 ')).toBe('민');
  });

  it('앞에 붙은 이모지는 변형 선택자까지 한 글자로 본다', () => {
    expect(getInitial('⚽️풋살')).toBe('⚽️');
  });

  it('국기와 ZWJ 이모지를 쪼개지 않는다', () => {
    expect(getInitial('🇰🇷코리아')).toBe('🇰🇷');
    expect(getInitial('👨‍👩‍👧가족')).toBe('👨‍👩‍👧');
    expect(isLoneSurrogate(getInitial('😀웃음'))).toBe(false);
    expect(getInitial('😀웃음')).toBe('😀');
  });

  it('공백뿐이거나 비어 있으면 기본값을 돌려준다', () => {
    expect(getInitial('   ')).toBe('?');
    expect(getInitial('')).toBe('?');
    expect(getInitial(null)).toBe('?');
    expect(getInitial(undefined)).toBe('?');
  });

  it('기본값을 바꿀 수 있다', () => {
    expect(getInitial(null, 'U')).toBe('U');
    expect(getInitial(' ', '')).toBe('');
    expect(getInitial('지수', 'U')).toBe('지');
  });
});

describe('firstCodePoint (Intl.Segmenter가 없을 때의 대체 경로)', () => {
  it('서로게이트 쌍을 반으로 자르지 않는다', () => {
    expect(firstCodePoint('😀웃음')).toBe('😀');
    expect(isLoneSurrogate(firstCodePoint('🇰🇷'))).toBe(false);
    expect(firstCodePoint('')).toBe('');
  });
});
