import { describe, it, expect } from 'vitest';
import {
  buildPushMessage,
  clientPushTitle,
  isStaleTokenError,
  parseNotificationIds,
  PUSH_BODY_MAX,
  shouldPush,
} from './pushRules';

const now = new Date('2026-10-29T10:00:00Z');
const fresh = { recipientId: 'bob', senderId: 'alice', type: 'new_message', title: 't', body: 'b', link: '/chat/r1', createdAt: new Date(now.getTime() - 5_000) };

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

  it('클라이언트 요청은 호출자가 만든 알림만 보낸다', () => {
    expect(shouldPush(fresh, 'carol', now)).toBe(false);
    expect(shouldPush({ ...fresh, senderId: undefined }, 'alice', now)).toBe(false);
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

describe('clientPushTitle', () => {
  it('알림 종류와 보낸 사람 닉네임으로 제목을 만든다', () => {
    expect(clientPushTitle('new_message', 'Alice')).toBe('Alice님의 새 메시지');
    expect(clientPushTitle('application_accepted', 'Alice')).toBe('Alice님이 참가 신청을 수락했어요');
  });

  it('알 수 없는 종류면 null', () => {
    expect(clientPushTitle('admin_notice', 'Alice')).toBeNull();
    expect(clientPushTitle(undefined, 'Alice')).toBeNull();
  });

  it('프로토타입 키는 알림 종류로 보지 않는다', () => {
    for (const type of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
      expect(clientPushTitle(type, 'Alice')).toBeNull();
    }
  });

  it('닉네임이 없거나 규칙에 맞지 않으면 이름 없는 제목', () => {
    expect(clientPushTitle('new_message', null)).toBe('새 메시지가 도착했어요');
    expect(clientPushTitle('new_message', undefined)).toBe('새 메시지가 도착했어요');
    expect(clientPushTitle('new_message', 123)).toBe('새 메시지가 도착했어요');
    // 예전 규칙으로 저장된 1글자 닉네임
    expect(clientPushTitle('new_message', '김')).toBe('새 메시지가 도착했어요');
    expect(clientPushTitle('new_message', '[관리자] 계정 확인이 필요합니다 지금')).toBe('새 메시지가 도착했어요');
    expect(clientPushTitle('application_received', `Al${String.fromCharCode(0x202e)}ice`)).toBe(
      '새 참가 신청이 도착했어요',
    );
    expect(clientPushTitle('recruit_closed', ' Alice')).toBe('모집이 마감되었어요');
  });
});

describe('buildPushMessage', () => {
  it('넘겨받은 제목으로 데이터 메시지를 만든다 (문서의 title은 쓰지 않는다)', () => {
    expect(buildPushMessage('tok', 'n1', fresh, '제목').message).toMatchObject({
      token: 'tok',
      data: { title: '제목', body: 'b', link: '/chat/r1', notificationId: 'n1' },
    });
  });

  it('본문은 최대 길이로 자른다', () => {
    const body = '가'.repeat(PUSH_BODY_MAX + 20);
    expect(Array.from(buildPushMessage('tok', 'n1', { ...fresh, body }, 't').message.data.body)).toHaveLength(
      PUSH_BODY_MAX,
    );
  });

  it('내부 경로가 아닌 link는 알림 목록으로 바꾼다', () => {
    expect(buildPushMessage('tok', 'n1', { ...fresh, link: 'https://evil.example' }, 't').message.data.link).toBe(
      '/notifications',
    );
    expect(buildPushMessage('tok', 'n1', { ...fresh, link: '//evil.example' }, 't').message.data.link).toBe(
      '/notifications',
    );
    // URL 파서가 탭·줄바꿈을 지우면 "//evil.example"이 되는 우회
    for (const link of ['/\t/evil.example', '/\n/evil.example', '/\r/evil.example']) {
      expect(buildPushMessage('tok', 'n1', { ...fresh, link }, 't').message.data.link).toBe('/notifications');
    }
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
