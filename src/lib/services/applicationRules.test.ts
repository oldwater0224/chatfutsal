import { describe, it, expect } from 'vitest';
import { ApplicationError, assertCanApply, assertPending, nextAcceptState } from './applicationRules';

const openPost = { status: 'open' as const, needCount: 3, acceptedCount: 0, applicantIds: [] as string[] };

describe('assertCanApply', () => {
  it('모집 중이고 처음 신청하면 통과', () => {
    expect(() => assertCanApply(openPost, 'u1')).not.toThrow();
  });

  it('이미 신청한 유저는 중복 신청 불가', () => {
    expect(() => assertCanApply({ ...openPost, applicantIds: ['u1'] }, 'u1')).toThrow('이미 신청한');
  });

  it('마감된 모집글에는 신청 불가', () => {
    expect(() => assertCanApply({ ...openPost, status: 'closed' }, 'u1')).toThrow(ApplicationError);
  });

  it('삭제된 모집글에는 신청 불가', () => {
    expect(() => assertCanApply(undefined, 'u1')).toThrow('존재하지 않는');
  });
});

describe('assertPending', () => {
  it('대기 중인 신청만 통과', () => {
    expect(() => assertPending({ status: 'pending' })).not.toThrow();
    expect(() => assertPending({ status: 'accepted' })).toThrow('이미 처리된');
    expect(() => assertPending({ status: 'rejected' })).toThrow('이미 처리된');
    expect(() => assertPending(undefined)).toThrow(ApplicationError);
  });
});

describe('nextAcceptState', () => {
  it('정원 미달이면 인원만 증가', () => {
    expect(nextAcceptState({ ...openPost, acceptedCount: 1 })).toEqual({ acceptedCount: 2, shouldClose: false });
  });

  it('마지막 자리를 수락하면 마감 대상', () => {
    expect(nextAcceptState({ ...openPost, acceptedCount: 2 })).toEqual({ acceptedCount: 3, shouldClose: true });
  });

  it('정원이 찬 상태에서는 수락 불가', () => {
    expect(() => nextAcceptState({ ...openPost, acceptedCount: 3 })).toThrow('모두 찼습니다');
  });

  it('마감된 모집글은 수락 불가', () => {
    expect(() => nextAcceptState({ ...openPost, status: 'closed' })).toThrow('마감된');
  });

  it('acceptedCount 필드가 없는 기존 글은 0명으로 간주', () => {
    expect(nextAcceptState({ status: 'open', needCount: 1 })).toEqual({ acceptedCount: 1, shouldClose: true });
  });
});
