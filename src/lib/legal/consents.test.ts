import { describe, it, expect } from 'vitest';
import { allRequiredAgreed, PRIVACY_NOTICE, PRIVACY_VERSION, REQUIRED_CONSENTS, TERMS_VERSION } from './consents';

describe('allRequiredAgreed', () => {
  it('필수 항목이 모두 true면 통과', () => {
    expect(allRequiredAgreed({ age14: true, terms: true })).toBe(true);
  });

  it('하나라도 false면 거부', () => {
    expect(allRequiredAgreed({ age14: false, terms: true })).toBe(false);
    expect(allRequiredAgreed({ age14: true, terms: false })).toBe(false);
  });

  it('누락된 항목이 있으면 거부', () => {
    expect(allRequiredAgreed({})).toBe(false);
    expect(allRequiredAgreed({ age14: true })).toBe(false);
    expect(allRequiredAgreed({ terms: true })).toBe(false);
  });

  it('truthy 값이어도 true가 아니면 거부', () => {
    expect(allRequiredAgreed({ age14: 1, terms: 'yes' } as unknown as Record<string, boolean>)).toBe(false);
  });
});

describe('동의 항목 정의', () => {
  it('필수 항목은 age14, terms 순서이고 모두 required', () => {
    expect(REQUIRED_CONSENTS.map((c) => c.id)).toEqual(['age14', 'terms']);
    expect(REQUIRED_CONSENTS.every((c) => c.required === true)).toBe(true);
  });

  it('약관 항목은 /terms 보기 링크를 가진다', () => {
    const terms = REQUIRED_CONSENTS.find((c) => c.id === 'terms');
    expect(terms).toMatchObject({ linkHref: '/terms', linkLabel: '보기' });
  });

  it('처리방침 고지는 /privacy로 연결된다', () => {
    expect(PRIVACY_NOTICE.linkHref).toBe('/privacy');
  });

  it('버전은 YYYY-MM-DD 형식', () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(PRIVACY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
