import { describe, it, expect } from 'vitest';
import { LEGAL_INFO, LEGAL_PLACEHOLDER, legalValue, missingLegalInfo, type LegalInfo } from './legalInfo';

const FILLED: LegalInfo = {
  serviceName: 'Svc',
  operatorName: '운영자',
  privacyOfficer: '운영자',
  contactEmail: 'a@example.com',
  firestoreRegion: 'region-a',
  vercelRegion: 'region-b',
  googlePrivacyContact: 'https://example.com/g',
  vercelPrivacyContact: 'https://example.com/v',
  privacyEffectiveDate: '2026-01-01',
  termsEffectiveDate: '2026-01-01',
};

describe('legalValue', () => {
  it('null·undefined면 placeholder', () => {
    expect(legalValue(null)).toBe(LEGAL_PLACEHOLDER);
    expect(legalValue(undefined)).toBe(LEGAL_PLACEHOLDER);
  });

  it('빈 문자열·공백이면 placeholder', () => {
    expect(legalValue('')).toBe(LEGAL_PLACEHOLDER);
    expect(legalValue('   ')).toBe(LEGAL_PLACEHOLDER);
  });

  it('값이 있으면 앞뒤 공백을 지우고 돌려준다', () => {
    expect(legalValue('운영자')).toBe('운영자');
    expect(legalValue('  운영자 ')).toBe('운영자');
  });
});

describe('missingLegalInfo', () => {
  it('모든 값이 있으면 빈 배열', () => {
    expect(missingLegalInfo(FILLED)).toEqual([]);
  });

  it('null·빈 문자열·공백 항목 이름만 키 순서대로 돌려준다', () => {
    const info: LegalInfo = { ...FILLED, contactEmail: null, vercelRegion: '', termsEffectiveDate: '  ' };
    expect(missingLegalInfo(info)).toEqual(['contactEmail', 'vercelRegion', 'termsEffectiveDate']);
  });

  it('인자를 생략하면 LEGAL_INFO를 검사한다', () => {
    expect(missingLegalInfo()).toEqual(missingLegalInfo(LEGAL_INFO));
  });

  // 릴리스 가드: 운영 정보에 미정 항목이 남아 있으면 실패한다
  it('LEGAL_INFO에 미정 항목이 없다', () => {
    expect(missingLegalInfo()).toEqual([]);
  });

  it('시행일은 YYYY-MM-DD 형식이다', () => {
    expect(LEGAL_INFO.privacyEffectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LEGAL_INFO.termsEffectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('국외 이전받는 자 연락처는 https URL이다', () => {
    expect(LEGAL_INFO.googlePrivacyContact).toMatch(/^https:\/\//);
    expect(LEGAL_INFO.vercelPrivacyContact).toMatch(/^https:\/\//);
  });
});
