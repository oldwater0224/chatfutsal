import { describe, it, expect } from 'vitest';
import { buildPushMessage, isStaleTokenError, parseNotificationIds, shouldPush } from './pushRules';

const now = new Date('2026-10-29T10:00:00Z');
const fresh = { recipientId: 'bob', title: 't', body: 'b', link: '/chat/r1', createdAt: new Date(now.getTime() - 5_000) };

describe('shouldPush', () => {
  it('방금 만든, 아직 안 보낸 다른 사람 알림이면 보낸다', () => {
    expect(shouldPush(fresh, 'alice', now)).toBe(true);
  });

  it('이미 보냈으면 보내지 않는다', () => {
    expect(shouldPush({ ...fresh, pushedAt: new Date() }, 'alice', now)).toBe(false);
  });

  it('2분이 지난 알림은 보내지 않는다', () => {
    expect(shouldPush({ ...fresh, createdAt: new Date(now.getTime() - 121_000) }, 'alice', now)).toBe(false);
  });

  it('createdAt이 없으면 보내지 않는다', () => {
    expect(shouldPush({ ...fresh, createdAt: undefined }, 'alice', now)).toBe(false);
  });

  it('자기 자신에게 가는 알림은 보내지 않는다', () => {
    expect(shouldPush(fresh, 'bob', now)).toBe(false);
  });

  it('크론(호출자 없음)은 받는 사람과 무관하게 보낸다', () => {
    expect(shouldPush(fresh, null, now)).toBe(true);
  });

  it('recipientId가 없으면 보내지 않는다', () => {
    expect(shouldPush({ ...fresh, recipientId: '' }, 'alice', now)).toBe(false);
  });
});

describe('parseNotificationIds', () => {
  it('ID 목록을 중복 없이 돌려준다', () => {
    expect(parseNotificationIds({ notificationIds: ['a1', 'b2', 'a1'] })).toEqual(['a1', 'b2']);
  });

  it('비었거나 형식이 틀리면 null', () => {
    expect(parseNotificationIds(null)).toBeNull();
    expect(parseNotificationIds({ notificationIds: [] })).toBeNull();
    expect(parseNotificationIds({ notificationIds: ['../users/x'] })).toBeNull();
    expect(parseNotificationIds({ notificationIds: [1] })).toBeNull();
    expect(parseNotificationIds({ notificationIds: Array.from({ length: 51 }, (_, i) => `n${i}`) })).toBeNull();
  });
});

describe('buildPushMessage', () => {
  it('데이터 메시지로 만든다', () => {
    expect(buildPushMessage('tok', 'n1', fresh).message).toMatchObject({
      token: 'tok',
      data: { title: 't', body: 'b', link: '/chat/r1', notificationId: 'n1' },
    });
  });

  it('내부 경로가 아닌 link는 알림 목록으로 바꾼다', () => {
    expect(buildPushMessage('tok', 'n1', { ...fresh, link: 'https://evil.example' }).message.data.link).toBe(
      '/notifications',
    );
    expect(buildPushMessage('tok', 'n1', { ...fresh, link: '//evil.example' }).message.data.link).toBe(
      '/notifications',
    );
  });
});

describe('isStaleTokenError', () => {
  it('UNREGISTERED면 만료 토큰', () => {
    expect(isStaleTokenError(404, { error: { status: 'NOT_FOUND', details: [{ errorCode: 'UNREGISTERED' }] } })).toBe(
      true,
    );
  });

  it('토큰 형식 오류면 만료 토큰', () => {
    expect(
      isStaleTokenError(400, {
        error: { status: 'INVALID_ARGUMENT', message: 'The registration token is not a valid FCM registration token' },
      }),
    ).toBe(true);
  });

  it('메시지 형식 오류나 서버 오류는 토큰을 지우지 않는다', () => {
    expect(isStaleTokenError(400, { error: { status: 'INVALID_ARGUMENT', message: 'Invalid JSON payload' } })).toBe(
      false,
    );
    expect(isStaleTokenError(500, { error: { status: 'INTERNAL' } })).toBe(false);
    expect(isStaleTokenError(503, null)).toBe(false);
  });
});
