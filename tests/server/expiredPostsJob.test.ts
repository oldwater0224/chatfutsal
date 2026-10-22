// 에뮬레이터에서 서버 정리 작업을 실제 REST 호출로 검증한다 (npm run test:rules)
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, Firestore, getDoc, getDocs, collection, query, where, setDoc } from 'firebase/firestore';
import { closeExpiredPosts } from '../../src/lib/server/expiredPostsJob';

let env: RulesTestEnvironment;
const now = new Date('2026-10-21T01:00:00Z'); // KST 10:00

async function withAdmin<T>(fn: (f: Firestore) => Promise<T>): Promise<T> {
  let out!: T;
  await env.withSecurityRulesDisabled(async (ctx) => {
    out = await fn(ctx.firestore() as unknown as Firestore);
  });
  return out;
}

const basePost = {
  authorId: 'alice',
  title: '지난 경기',
  date: '2026-10-21',
  time: '09:00',
  needCount: 3,
  acceptedCount: 1,
  applicantIds: ['bob', 'carol'],
  status: 'open',
};

beforeAll(async () => {
  process.env.FIREBASE_PROJECT_ID = 'demo-chatfutsal';
  env = await initializeTestEnvironment({ projectId: 'demo-chatfutsal' });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('closeExpiredPosts', () => {
  it('지난 경기 글을 마감하고 대기 신청을 정리하며 알림을 보낸다', async () => {
    await withAdmin(async (f) => {
      await setDoc(doc(f, 'recruitPosts/p1'), basePost);
      await setDoc(doc(f, 'applications/a1'), { postId: 'p1', applicantId: 'bob', status: 'accepted' });
      await setDoc(doc(f, 'applications/a2'), { postId: 'p1', applicantId: 'carol', status: 'pending' });
    });

    const result = await closeExpiredPosts(now);
    expect(result).toEqual({ checked: 1, closedPosts: 1, closedApplications: 1 });

    await withAdmin(async (f) => {
      const post = (await getDoc(doc(f, 'recruitPosts/p1'))).data()!;
      expect(post.status).toBe('closed');
      expect(post.applicantIds).toEqual(['bob']);
      expect(post.updatedAt).toBeDefined();
      expect((await getDoc(doc(f, 'applications/a1'))).data()!.status).toBe('accepted');
      expect((await getDoc(doc(f, 'applications/a2'))).data()!.status).toBe('closed');

      const notis = await getDocs(query(collection(f, 'notifications'), where('recipientId', '==', 'carol')));
      expect(notis.size).toBe(1);
      expect(notis.docs[0].data()).toMatchObject({
        type: 'recruit_closed',
        title: '모집이 마감되었어요',
        body: '지난 경기',
        link: '/recruit/p1',
        isRead: false,
      });
      expect(notis.docs[0].data().createdAt).toBeDefined();
    });
  });

  it('이미 마감됐지만 대기 신청이 남은 글도 정리한다', async () => {
    await withAdmin(async (f) => {
      await setDoc(doc(f, 'recruitPosts/p1'), { ...basePost, status: 'closed' });
      await setDoc(doc(f, 'applications/a2'), { postId: 'p1', applicantId: 'carol', status: 'pending' });
    });

    const result = await closeExpiredPosts(now);
    expect(result).toMatchObject({ closedPosts: 0, closedApplications: 1 });
    await withAdmin(async (f) => {
      expect((await getDoc(doc(f, 'applications/a2'))).data()!.status).toBe('closed');
    });
  });

  it('경기 전 글과 범위 밖의 오래된 글은 건드리지 않는다', async () => {
    await withAdmin(async (f) => {
      await setDoc(doc(f, 'recruitPosts/future'), { ...basePost, time: '20:00' });
      await setDoc(doc(f, 'recruitPosts/old'), { ...basePost, date: '2026-10-01' });
      await setDoc(doc(f, 'applications/a1'), { postId: 'future', applicantId: 'carol', status: 'pending' });
    });

    const result = await closeExpiredPosts(now);
    expect(result).toEqual({ checked: 1, closedPosts: 0, closedApplications: 0 });
    await withAdmin(async (f) => {
      expect((await getDoc(doc(f, 'recruitPosts/future'))).data()!.status).toBe('open');
      expect((await getDoc(doc(f, 'recruitPosts/old'))).data()!.status).toBe('open');
      expect((await getDoc(doc(f, 'applications/a1'))).data()!.status).toBe('pending');
    });
  });

  it('두 번 실행해도 알림이 중복되지 않는다', async () => {
    await withAdmin(async (f) => {
      await setDoc(doc(f, 'recruitPosts/p1'), basePost);
      await setDoc(doc(f, 'applications/a2'), { postId: 'p1', applicantId: 'carol', status: 'pending' });
    });

    await closeExpiredPosts(now);
    const second = await closeExpiredPosts(now);
    expect(second).toMatchObject({ closedPosts: 0, closedApplications: 0 });
    await withAdmin(async (f) => {
      const notis = await getDocs(query(collection(f, 'notifications'), where('recipientId', '==', 'carol')));
      expect(notis.size).toBe(1);
    });
  });
});
