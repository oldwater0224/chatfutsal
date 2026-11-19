import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  sendPushForNotifications: vi.fn(),
}));

vi.mock('@/src/lib/server/idToken', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/lib/server/idToken')>();
  return { ...actual, verifyIdToken: mocks.verifyIdToken };
});
vi.mock('@/src/lib/server/pushJob', () => ({ sendPushForNotifications: mocks.sendPushForNotifications }));

import { IdTokenVerifierError } from '@/src/lib/server/idToken';
import { POST } from './route';

function request(headers: Record<string, string> = { authorization: 'Bearer tok' }) {
  return new NextRequest('http://localhost/api/push', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ notificationIds: ['n1'] }),
  });
}

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => errorSpy.mockRestore());

describe('POST /api/push 인증', () => {
  it('토큰이 없으면 401', async () => {
    const res = await POST(request({}));
    expect(res.status).toBe(401);
    expect(mocks.verifyIdToken).not.toHaveBeenCalled();
  });

  it('잘못된 토큰이면 401', async () => {
    mocks.verifyIdToken.mockResolvedValue(null);
    const res = await POST(request());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });
  });

  it('공개 인증서 조회 실패면 503과 원인 로그(스택 없이)', async () => {
    mocks.verifyIdToken.mockRejectedValue(new IdTokenVerifierError('unavailable', '공개 인증서 조회 실패: HTTP 500'));
    const res = await POST(request());
    expect(res.status).toBe(503);
    expect(errorSpy).toHaveBeenCalledWith(expect.any(String), '공개 인증서 조회 실패: HTTP 500');
    expect(mocks.sendPushForNotifications).not.toHaveBeenCalled();
  });

  it('프로젝트 ID 설정 오류면 401이 아니라 500', async () => {
    mocks.verifyIdToken.mockRejectedValue(new IdTokenVerifierError('config', '환경 변수가 없습니다'));
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(errorSpy).toHaveBeenCalledWith('푸시 인증 설정 오류:', '환경 변수가 없습니다');
  });

  it('검증에 성공하면 발송한다', async () => {
    mocks.verifyIdToken.mockResolvedValue('alice');
    mocks.sendPushForNotifications.mockResolvedValue({ sent: 1 });
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(mocks.sendPushForNotifications).toHaveBeenCalledWith(['n1'], 'alice');
  });
});
