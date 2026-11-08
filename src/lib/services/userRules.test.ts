import { describe, it, expect } from 'vitest';
import {
  DEFAULT_COPIED_NAME,
  isValidDisplayName,
  nameForCopy,
  toInitialDisplayName,
  validateDisplayName,
} from './userRules';

describe('validateDisplayName', () => {
  it('앞뒤 공백을 제거한 값을 돌려준다', () => {
    expect(validateDisplayName('  풋살러 ', '기존이름')).toEqual({ ok: true, value: '풋살러' });
  });

  it('2자 미만이면 오류', () => {
    expect(validateDisplayName(' 김 ', '기존이름')).toMatchObject({ ok: false, reason: 'invalid' });
    expect(validateDisplayName('   ', '기존이름')).toMatchObject({ ok: false, reason: 'invalid' });
  });

  it('12자를 넘으면 오류, 12자는 통과', () => {
    expect(validateDisplayName('가'.repeat(13), '기존이름')).toMatchObject({ ok: false, reason: 'invalid' });
    expect(validateDisplayName('가'.repeat(12), '기존이름')).toEqual({ ok: true, value: '가'.repeat(12) });
  });

  it('이모지는 한 글자로 센다', () => {
    expect(validateDisplayName('⚽'.repeat(12), '기존이름')).toMatchObject({ ok: true });
    expect(validateDisplayName('😀'.repeat(12), '기존이름')).toMatchObject({ ok: true });
  });

  it('현재 닉네임과 같으면 unchanged (공백 차이 무시)', () => {
    expect(validateDisplayName(' 풋살러 ', '풋살러')).toEqual({ ok: false, reason: 'unchanged' });
  });

  it('현재 닉네임이 없으면 형식만 검사', () => {
    expect(validateDisplayName('풋살러', null)).toEqual({ ok: true, value: '풋살러' });
    expect(validateDisplayName('풋살러')).toEqual({ ok: true, value: '풋살러' });
  });
});

// 보이지 않는 문자는 소스에 그대로 쓰지 않고 코드로 만든다
const ch = (code: number) => String.fromCharCode(code);
const FORBIDDEN = [0x00, 0x0a, 0x1f, 0x7f, 0x200b, 0x2060, 0xfeff, 0x202a, 0x202e, 0x2066, 0x2069].map(ch);
const ZWJ = ch(0x200d);

describe('validateDisplayName 금지 문자', () => {
  it('제어문자·보이지 않는 문자·방향 제어 문자가 있으면 오류', () => {
    for (const c of FORBIDDEN) {
      expect(validateDisplayName(`풋${c}살`, '기존이름')).toMatchObject({ ok: false, reason: 'invalid' });
    }
  });

  it('ZWJ 이모지 조합은 허용', () => {
    expect(validateDisplayName(`풋살👨${ZWJ}👩`, '기존이름')).toMatchObject({ ok: true });
  });
});

describe('isValidDisplayName', () => {
  it('규칙에 맞는 닉네임', () => {
    expect(isValidDisplayName('풋살러')).toBe(true);
    expect(isValidDisplayName('가'.repeat(12))).toBe(true);
    expect(isValidDisplayName('😀'.repeat(12))).toBe(true);
  });

  it('문자열이 아니거나 길이·공백·금지 문자가 맞지 않으면 false', () => {
    expect(isValidDisplayName(undefined)).toBe(false);
    expect(isValidDisplayName(null)).toBe(false);
    expect(isValidDisplayName(123)).toBe(false);
    expect(isValidDisplayName('김')).toBe(false);
    expect(isValidDisplayName('가'.repeat(13))).toBe(false);
    expect(isValidDisplayName(' 풋살러')).toBe(false);
    expect(isValidDisplayName(`풋${ch(0x202e)}살`)).toBe(false);
  });
});

describe('toInitialDisplayName', () => {
  it('정상 이름은 그대로', () => {
    expect(toInitialDisplayName('풋살러')).toBe('풋살러');
  });

  it('금지 문자를 지우고 앞뒤 공백을 없앤다', () => {
    expect(toInitialDisplayName(`  풋${ch(0x200b)}살${ch(0x202e)}러 `)).toBe('풋살러');
  });

  it('12자로 자르고 잘린 끝의 공백도 없앤다', () => {
    expect(toInitialDisplayName('가'.repeat(20))).toBe('가'.repeat(12));
    expect(toInitialDisplayName(`${'가'.repeat(11)} 나다`)).toBe('가'.repeat(11));
    expect(toInitialDisplayName('😀'.repeat(13))).toBe('😀'.repeat(12));
  });

  it('없거나 너무 짧으면 기본값', () => {
    expect(toInitialDisplayName(undefined)).toBe('카카오 사용자');
    expect(toInitialDisplayName('김')).toBe('카카오 사용자');
    expect(toInitialDisplayName(ch(0x200b).repeat(3))).toBe('카카오 사용자');
    expect(toInitialDisplayName('', '손님')).toBe('손님');
  });
});

describe('nameForCopy', () => {
  it('users 문서 닉네임을 그대로 쓰고, 없으면 기본값', () => {
    expect(nameForCopy('풋살러')).toBe('풋살러');
    // 예전 규칙으로 저장된 긴 닉네임도 그대로 (보안 규칙이 users 문서와 같은지만 본다)
    expect(nameForCopy('가'.repeat(30))).toBe('가'.repeat(30));
    expect(nameForCopy('')).toBe(DEFAULT_COPIED_NAME);
    expect(nameForCopy(undefined)).toBe('사용자');
  });
});
