import { describe, it, expect } from 'vitest';
import {
  ApplicationError,
  applicantsToNotifyOnDelete,
  assertCanApply,
  assertCanReopen,
  assertPending,
  nextAcceptState,
  pendingApplications,
} from './applicationRules';

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

describe('applicantsToNotifyOnDelete', () => {
  it('대기·수락 상태 신청자만 알림 대상', () => {
    expect(
      applicantsToNotifyOnDelete([
        { applicantId: 'u1', status: 'pending' },
        { applicantId: 'u2', status: 'accepted' },
        { applicantId: 'u3', status: 'rejected' },
      ]),
    ).toEqual(['u1', 'u2']);
  });

  it('같은 신청자가 여러 번 있어도 한 번만 알림', () => {
    expect(
      applicantsToNotifyOnDelete([
        { applicantId: 'u1', status: 'pending' },
        { applicantId: 'u1', status: 'accepted' },
      ]),
    ).toEqual(['u1']);
  });

  it('신청이 없으면 빈 배열', () => {
    expect(applicantsToNotifyOnDelete([])).toEqual([]);
  });
});

describe('pendingApplications', () => {
  it('대기 중인 신청만 골라낸다', () => {
    const apps = [
      { id: 'a', status: 'pending' as const },
      { id: 'b', status: 'accepted' as const },
      { id: 'c', status: 'pending' as const },
      { id: 'd', status: 'closed' as const },
    ];
    expect(pendingApplications(apps).map((a) => a.id)).toEqual(['a', 'c']);
  });
});

describe('assertCanReopen', () => {
  const closedPost = { status: 'closed' as const, needCount: 3, acceptedCount: 1, date: '2099-01-01', time: '18:00' };

  it('정원이 남고 경기 전이면 재오픈 가능', () => {
    expect(() => assertCanReopen(closedPost)).not.toThrow();
  });

  it('정원이 찬 글은 재오픈 불가', () => {
    expect(() => assertCanReopen({ ...closedPost, acceptedCount: 3 })).toThrow('모두 찼습니다');
  });

  it('경기 시간이 지난 글은 재오픈 불가', () => {
    expect(() => assertCanReopen({ ...closedPost, date: '2020-01-01' })).toThrow('경기 시간이 지난');
  });

  it('이미 모집 중이거나 없는 글은 불가', () => {
    expect(() => assertCanReopen({ ...closedPost, status: 'open' })).toThrow('이미 모집 중');
    expect(() => assertCanReopen(undefined)).toThrow(ApplicationError);
  });
});
