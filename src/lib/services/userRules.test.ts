import { describe, it, expect } from 'vitest';
import { validateDisplayName } from './userRules';

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
