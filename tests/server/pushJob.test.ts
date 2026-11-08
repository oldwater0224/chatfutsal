// 에뮬레이터에서 푸시 발송 작업을 실제 REST 호출로 검증한다 (npm run test:rules)
// FCM 호출만 가짜로 바꾼다
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, Firestore, getDoc, getDocs, setDoc } from 'firebase/firestore';

const sent: { token: string; notificationId: string; title: string }[] = [];
vi.mock('../../src/lib/server/fcm', () => ({
  sendFcmMessage: vi.fn(
    async (message: { message: { token: string; data: { notificationId: string; title: string } } }) => {
      const { token, data } = message.message;
      sent.push({ token, notificationId: data.notificationId, title: data.title });
      return token === 'stale-token' ? 'stale' : 'sent';
    },
  ),
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
  senderId: 'alice',
  type: 'new_message',
  title: '[관리자] 계정 확인 필요',
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
    await setDoc(doc(db, 'users/alice'), { displayName: 'Alice' });
    await setDoc(doc(db, 'fcmTokens/good-token'), { uid: 'bob', updatedAt: new Date() });
    await setDoc(doc(db, 'fcmTokens/stale-token'), { uid: 'bob', updatedAt: new Date() });
    await setDoc(doc(db, 'fcmTokens/carol-token'), { uid: 'carol', updatedAt: new Date() });
  });
});

describe('sendPushForNotifications', () => {
  it('받는 사람의 모든 토큰으로 보내고, 만료 토큰은 지우고, pushedAt을 남긴다', async () => {
    await withAdmin((db) => setDoc(doc(db, 'notifications/n1'), notification(new Date())));

    const result = await sendPushForNotifications(['n1'], 'alice');

    expect(result).toEqual({ notifications: 1, sent: 1, staleTokens: 1, errors: 0 });
    expect(sent.map((s) => s.token).sort()).toEqual(['good-token', 'stale-token']);
    await withAdmin(async (db) => {
      const tokens = await getDocs(collection(db, 'fcmTokens'));
      expect(tokens.docs.map((d) => d.id).sort()).toEqual(['carol-token', 'good-token']);
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

  it('저장된 title 대신 보낸 사람 닉네임으로 만든 제목을 쓴다', async () => {
    await withAdmin((db) => setDoc(doc(db, 'notifications/n1'), notification(new Date())));

    await sendPushForNotifications(['n1'], 'alice');

    expect(sent.map((s) => s.title)).toEqual(['Alice님의 새 메시지', 'Alice님의 새 메시지']);
  });

  it('보낸 사람 닉네임이 규칙에 맞지 않거나 없으면 이름 없는 제목을 쓴다', async () => {
    await withAdmin((db) => setDoc(doc(db, 'users/alice'), { displayName: '[관리자] 계정 확인 필요 지금 바로 확인' }));
    await withAdmin((db) => setDoc(doc(db, 'notifications/n1'), notification(new Date())));

    await sendPushForNotifications(['n1'], 'alice');

    expect(sent.map((s) => s.title)).toEqual(['새 메시지가 도착했어요', '새 메시지가 도착했어요']);

    sent.length = 0;
    await withAdmin((db) => setDoc(doc(db, 'users/alice'), { email: null }));
    await withAdmin((db) => setDoc(doc(db, 'notifications/n2'), notification(new Date())));

    await sendPushForNotifications(['n2'], 'alice');

    // 만료 토큰은 앞의 발송에서 지워졌다
    expect(sent.map((s) => s.title)).toEqual(['새 메시지가 도착했어요']);
  });

  it('프로토타입 키(constructor 등)를 종류로 쓴 알림은 보내지 않는다', async () => {
    await withAdmin((db) => setDoc(doc(db, 'notifications/n1'), { ...notification(new Date()), type: 'constructor' }));
    await withAdmin((db) => setDoc(doc(db, 'notifications/n2'), { ...notification(new Date()), type: '__proto__' }));

    const result = await sendPushForNotifications(['n1', 'n2'], 'alice');

    expect(result.notifications).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it('다른 사람이 만든 알림은 보내지 않는다', async () => {
    await withAdmin((db) => setDoc(doc(db, 'notifications/n1'), notification(new Date())));

    const result = await sendPushForNotifications(['n1'], 'carol');

    expect(result.notifications).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it('크론(호출자 없음)은 문서의 title을 그대로 쓴다', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senderId, ...serverNotification } = notification(new Date());
    await withAdmin((db) =>
      setDoc(doc(db, 'notifications/n1'), {
        ...serverNotification,
        type: 'recruit_closed',
        title: '모집이 마감되었어요',
      }),
    );

    await sendPushForNotifications(['n1'], null);

    expect(sent.map((s) => s.title)).toEqual(['모집이 마감되었어요', '모집이 마감되었어요']);
  });
});
