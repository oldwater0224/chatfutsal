import { describe, it, expect } from 'vitest';
import { PRIVACY_VERSION } from './consents';
import { LEGAL_INFO, LEGAL_PLACEHOLDER, legalValue, missingLegalInfo, type LegalInfo } from './legalInfo';

const FILLED: LegalInfo = {
  serviceName: 'Svc',
  operatorName: '홍길동',
  privacyOfficer: '김철수',
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

  it('operatorName·privacyOfficer가 일반 명칭이면 미정으로 본다 (앞뒤 공백 무시)', () => {
    expect(missingLegalInfo({ ...FILLED, operatorName: '운영자' })).toEqual(['operatorName']);
    expect(missingLegalInfo({ ...FILLED, privacyOfficer: '  운영자 ' })).toEqual(['privacyOfficer']);
    expect(missingLegalInfo({ ...FILLED, operatorName: '관리자', privacyOfficer: 'Admin' })).toEqual([
      'operatorName',
      'privacyOfficer',
    ]);
    expect(missingLegalInfo({ ...FILLED, privacyOfficer: LEGAL_PLACEHOLDER })).toEqual(['privacyOfficer']);
  });

  it('일반 명칭 검사는 이름 필드에만 적용한다', () => {
    expect(missingLegalInfo({ ...FILLED, serviceName: '운영자' })).toEqual([]);
  });

  it('일반 명칭을 포함하기만 한 실제 이름은 통과한다', () => {
    expect(missingLegalInfo({ ...FILLED, operatorName: '운영자 홍길동' })).toEqual([]);
  });

  it('인자를 생략하면 LEGAL_INFO를 검사한다', () => {
    expect(missingLegalInfo()).toEqual(missingLegalInfo(LEGAL_INFO));
  });

  // 릴리스 가드: 운영 정보에 미정 항목이 남아 있으면 실패한다
  it('LEGAL_INFO에 미정 항목이 없다', () => {
    expect(missingLegalInfo()).toEqual([]);
  });

  it('LEGAL_INFO 이름 필드는 일반 명칭이 아니다', () => {
    expect(missingLegalInfo(LEGAL_INFO)).not.toContain('operatorName');
    expect(missingLegalInfo(LEGAL_INFO)).not.toContain('privacyOfficer');
  });

  it('시행일은 YYYY-MM-DD 형식이다', () => {
    expect(LEGAL_INFO.privacyEffectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LEGAL_INFO.termsEffectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('개인정보 처리방침 시행일은 PRIVACY_VERSION과 같다', () => {
    expect(LEGAL_INFO.privacyEffectiveDate).toBe(PRIVACY_VERSION);
  });

  it('국외 이전받는 자 연락처는 https URL이다', () => {
    expect(LEGAL_INFO.googlePrivacyContact).toMatch(/^https:\/\//);
    expect(LEGAL_INFO.vercelPrivacyContact).toMatch(/^https:\/\//);
  });
});
