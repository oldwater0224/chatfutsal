// 에뮬레이터에서 오래된 알림 삭제를 실제 REST 호출로 검증한다 (npm run test:rules)
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, Firestore, getDocs, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { deleteOldNotifications } from '../../src/lib/server/notificationRetention';

let env: RulesTestEnvironment;
const now = new Date('2026-11-18T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => Timestamp.fromDate(new Date(now.getTime() - days * DAY));

async function withAdmin<T>(fn: (f: Firestore) => Promise<T>): Promise<T> {
  let out!: T;
  await env.withSecurityRulesDisabled(async (ctx) => {
    out = await fn(ctx.firestore() as unknown as Firestore);
  });
  return out;
}

const noti = (createdAt: unknown) => ({
  recipientId: 'bob',
  type: 'application_received',
  title: 't',
  body: 'b',
  link: '/',
  isRead: false,
  createdAt,
});

const remainingIds = () =>
  withAdmin(async (f) => (await getDocs(collection(f, 'notifications'))).docs.map((d) => d.id).sort());

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

describe('deleteOldNotifications', () => {
  it('90일이 지난 알림만 지운다', async () => {
    await withAdmin(async (f) => {
      await setDoc(doc(f, 'notifications/old'), noti(daysAgo(91)));
      await setDoc(doc(f, 'notifications/edge'), noti(daysAgo(89)));
      await setDoc(doc(f, 'notifications/recent'), noti(daysAgo(1)));
      // createdAt이 없거나 null인 문서는 범위 조회에 걸리지 않아 남는다
      await setDoc(doc(f, 'notifications/nullTime'), noti(null));
    });

    const result = await deleteOldNotifications(now);
    expect(result).toEqual({ deletedNotifications: 1 });
    expect(await remainingIds()).toEqual(['edge', 'nullTime', 'recent']);
  });

  it('한 번 실행에서 지우는 수에 상한이 있고, 다음 실행에서 이어서 지운다', async () => {
    await withAdmin(async (f) => {
      const batch = writeBatch(f);
      for (let i = 0; i < 7; i++) batch.set(doc(f, `notifications/old${i}`), noti(daysAgo(100 + i)));
      batch.set(doc(f, 'notifications/recent'), noti(daysAgo(1)));
      await batch.commit();
    });

    expect(await deleteOldNotifications(now, { maxDeletes: 5 })).toEqual({ deletedNotifications: 5 });
    expect((await remainingIds()).length).toBe(3);

    expect(await deleteOldNotifications(now, { maxDeletes: 5 })).toEqual({ deletedNotifications: 2 });
    expect(await remainingIds()).toEqual(['recent']);
  });

  it('지울 알림이 없으면 아무것도 하지 않는다', async () => {
    expect(await deleteOldNotifications(now)).toEqual({ deletedNotifications: 0 });
  });
});
