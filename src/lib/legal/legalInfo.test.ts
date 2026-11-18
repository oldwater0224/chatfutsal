import { describe, it, expect } from 'vitest';
import { LEGAL_INFO, LEGAL_PLACEHOLDER, legalValue, missingLegalInfo } from './legalInfo';

describe('legalValue', () => {
  it('null·undefined면 placeholder', () => {
    expect(legalValue(null)).toBe(LEGAL_PLACEHOLDER);
    expect(legalValue(undefined)).toBe(LEGAL_PLACEHOLDER);
  });

  it('빈 문자열·공백이면 placeholder', () => {
    expect(legalValue('')).toBe(LEGAL_PLACEHOLDER);
    expect(legalValue('   ')).toBe(LEGAL_PLACEHOLDER);
  });

  it('값이 있으면 그대로 돌려준다', () => {
    expect(legalValue('운영자')).toBe('운영자');
    expect(legalValue(LEGAL_INFO.serviceName)).toBe('ChatFutsal');
  });
});

describe('missingLegalInfo', () => {
  it('값이 null인 항목 이름만 돌려준다', () => {
    const expected = (Object.keys(LEGAL_INFO) as (keyof typeof LEGAL_INFO)[]).filter((k) => LEGAL_INFO[k] == null);
    expect(missingLegalInfo()).toEqual(expected);
  });

  it('현재 미정 항목: 이메일, 리전 2개, 국외 이전받는 자 연락처 2개, 시행일 2개', () => {
    expect(missingLegalInfo()).toEqual([
      'contactEmail',
      'firestoreRegion',
      'vercelRegion',
      'googlePrivacyContact',
      'vercelPrivacyContact',
      'privacyEffectiveDate',
      'termsEffectiveDate',
    ]);
  });

  it('정해진 항목은 포함하지 않는다', () => {
    expect(missingLegalInfo()).not.toContain('serviceName');
    expect(missingLegalInfo()).not.toContain('privacyOfficer');
  });
});
