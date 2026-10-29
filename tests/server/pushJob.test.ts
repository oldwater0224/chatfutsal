// 에뮬레이터에서 푸시 발송 작업을 실제 REST 호출로 검증한다 (npm run test:rules)
// FCM 호출만 가짜로 바꾼다
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, Firestore, getDoc, getDocs, setDoc } from 'firebase/firestore';

const sent: { token: string; notificationId: string }[] = [];
vi.mock('../../src/lib/server/fcm', () => ({
  sendFcmMessage: vi.fn(async (message: { message: { token: string; data: { notificationId: string } } }) => {
    sent.push({ token: message.message.token, notificationId: message.message.data.notificationId });
    return message.message.token === 'stale-token' ? 'stale' : 'sent';
  }),
}));

import { sendPushForNotifications } from '../../src/lib/server/pushJob';

let env: RulesTestEnvironment;

async function withAdmin<T>(fn: (f: Firestore) => Promise<T>): Promise<T> {
  let out!: T;
  await env.withSecurityRulesDisabled(async (ctx) => {
    out = await fn(ctx.firestore() as unknown as Firestore);
  });
  return out;
}

const notification = (createdAt: Date) => ({
  recipientId: 'bob',
  type: 'new_message',
  title: 'Alice님의 새 메시지',
  body: '안녕',
  link: '/chat/r1',
  isRead: false,
  createdAt,
});

beforeAll(async () => {
  process.env.FIREBASE_PROJECT_ID = 'demo-chatfutsal';
  env = await initializeTestEnvironment({ projectId: 'demo-chatfutsal' });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  sent.length = 0;
  await env.clearFirestore();
  await withAdmin(async (db) => {
    await setDoc(doc(db, 'users/bob/fcmTokens/good-token'), { token: 'good-token', updatedAt: new Date() });
    await setDoc(doc(db, 'users/bob/fcmTokens/stale-token'), { token: 'stale-token', updatedAt: new Date() });
  });
});

describe('sendPushForNotifications', () => {
  it('받는 사람의 모든 토큰으로 보내고, 만료 토큰은 지우고, pushedAt을 남긴다', async () => {
    await withAdmin((db) => setDoc(doc(db, 'notifications/n1'), notification(new Date())));

    const result = await sendPushForNotifications(['n1'], 'alice');

    expect(result).toEqual({ notifications: 1, sent: 1, staleTokens: 1 });
    expect(sent.map((s) => s.token).sort()).toEqual(['good-token', 'stale-token']);
    await withAdmin(async (db) => {
      const tokens = await getDocs(collection(db, 'users/bob/fcmTokens'));
      expect(tokens.docs.map((d) => d.id)).toEqual(['good-token']);
      expect((await getDoc(doc(db, 'notifications/n1'))).data()?.pushedAt).toBeTruthy();
    });
  });

  it('같은 알림을 다시 요청하면 보내지 않는다 (동시 요청 포함)', async () => {
    await withAdmin((db) => setDoc(doc(db, 'notifications/n1'), notification(new Date())));

    const results = await Promise.all([
      sendPushForNotifications(['n1'], 'alice'),
      sendPushForNotifications(['n1'], 'alice'),
    ]);
    const again = await sendPushForNotifications(['n1'], 'alice');

    expect(results.map((r) => r.notifications).sort()).toEqual([0, 1]);
    expect(again.notifications).toBe(0);
    expect(sent.filter((s) => s.token === 'good-token')).toHaveLength(1);
  });

  it('오래된 알림, 없는 알림, 자기 자신에게 가는 알림은 보내지 않는다', async () => {
    await withAdmin((db) => setDoc(doc(db, 'notifications/old'), notification(new Date(Date.now() - 10 * 60_000))));
    await withAdmin((db) => setDoc(doc(db, 'notifications/self'), notification(new Date())));

    const result = await sendPushForNotifications(['old', 'missing', 'self'], 'bob');

    expect(result.notifications).toBe(0);
    expect(sent).toHaveLength(0);
  });
});
