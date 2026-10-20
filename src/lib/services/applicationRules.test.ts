import { describe, it, expect } from 'vitest';
import {
  ApplicationError,
  applicantsToNotifyOnDelete,
  assertCanApply,
  assertCanReopen,
  assertPending,
  displayApplicationStatus,
  hasUnclearedPendingApplications,
  nextAcceptState,
  pendingApplications,
  selectPostsToCleanup,
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

describe('hasUnclearedPendingApplications', () => {
  it('마감 글에 신청자가 수락 인원보다 많으면 대기 신청이 남은 것', () => {
    expect(
      hasUnclearedPendingApplications({
        status: 'closed',
        applicantIds: ['u1', 'u2'],
        acceptedCount: 1,
      }),
    ).toBe(true);
  });

  it('신청자가 모두 수락 인원이면 정리할 것이 없다', () => {
    expect(
      hasUnclearedPendingApplications({
        status: 'closed',
        applicantIds: ['u1', 'u2'],
        acceptedCount: 2,
      }),
    ).toBe(false);
  });

  it('모집 중인 글은 대상이 아니다', () => {
    expect(
      hasUnclearedPendingApplications({
        status: 'open',
        applicantIds: ['u1'],
        acceptedCount: 0,
      }),
    ).toBe(false);
  });

  it('신청자가 없으면 대상이 아니다', () => {
    expect(hasUnclearedPendingApplications({ status: 'closed', applicantIds: [] })).toBe(false);
  });

  it('필드가 없는 기존 글은 0으로 간주', () => {
    expect(hasUnclearedPendingApplications({ status: 'closed' })).toBe(false);
  });

  it('acceptedCount가 없고 신청자만 있으면 대기 신청이 남은 것', () => {
    expect(hasUnclearedPendingApplications({ status: 'closed', applicantIds: ['u1'] })).toBe(true);
  });

  it('없는 글은 대상이 아니다', () => {
    expect(hasUnclearedPendingApplications(undefined)).toBe(false);
  });
});

describe('selectPostsToCleanup', () => {
  const needsCleanup = {
    id: 'p1',
    title: '마감된 글',
    status: 'closed' as const,
    applicantIds: ['u1'],
    acceptedCount: 0,
  };
  const clean = {
    id: 'p2',
    title: '정리된 글',
    status: 'closed' as const,
    applicantIds: ['u1'],
    acceptedCount: 1,
  };

  it('정리가 필요한 글만 고른다', () => {
    expect(selectPostsToCleanup([needsCleanup, clean], new Set()).map((p) => p.id)).toEqual(['p1']);
  });

  it('이미 시도한 글은 제외한다', () => {
    expect(selectPostsToCleanup([needsCleanup], new Set(['p1']))).toEqual([]);
  });

  it('대상이 없으면 빈 배열', () => {
    expect(selectPostsToCleanup([clean], new Set())).toEqual([]);
  });
});

describe('displayApplicationStatus', () => {
  it('마감된 글의 대기 신청은 마감으로 표시', () => {
    expect(displayApplicationStatus('pending', 'closed')).toBe('closed');
  });

  it('모집 중인 글의 대기 신청은 그대로', () => {
    expect(displayApplicationStatus('pending', 'open')).toBe('pending');
  });

  it('이미 처리된 신청은 글 상태와 무관하게 그대로', () => {
    expect(displayApplicationStatus('accepted', 'closed')).toBe('accepted');
    expect(displayApplicationStatus('rejected', 'closed')).toBe('rejected');
  });

  it('글 상태를 모르면 그대로', () => {
    expect(displayApplicationStatus('pending', undefined)).toBe('pending');
  });
});
