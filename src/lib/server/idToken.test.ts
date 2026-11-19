import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { IdTokenVerifierError, resetIdTokenCertCache, verifyIdToken } from './idToken';

// kid만 있으면 되는 서명 없는 토큰 (형식 검사 단계까지만 통과)
const tokenWithKid = jwt.sign({ sub: 'alice' }, 'secret', { algorithm: 'HS256', keyid: 'k1' });

beforeEach(() => {
  resetIdTokenCertCache();
  vi.stubEnv('FIREBASE_PROJECT_ID', 'demo-project');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('verifyIdToken', () => {
  it('JWT 형식이 아니면 null', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(verifyIdToken('garbage')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('인증서에 없는 kid면 null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ other: 'cert' })));
    await expect(verifyIdToken(tokenWithKid)).resolves.toBeNull();
  });

  it('서명이 맞지 않으면 null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ k1: 'not-a-cert' })));
    await expect(verifyIdToken(tokenWithKid)).resolves.toBeNull();
  });

  it('인증서 조회가 네트워크 오류면 unavailable 오류', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('fetch failed'))));
    const error = await verifyIdToken(tokenWithKid).catch((e) => e);
    expect(error).toBeInstanceOf(IdTokenVerifierError);
    expect(error.kind).toBe('unavailable');
    expect(error.message).toContain('fetch failed');
  });

  it('인증서 조회가 HTTP 오류면 unavailable 오류', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 503 })));
    const error = await verifyIdToken(tokenWithKid).catch((e) => e);
    expect(error).toBeInstanceOf(IdTokenVerifierError);
    expect(error.kind).toBe('unavailable');
    expect(error.message).toContain('503');
  });

  it('프로젝트 ID가 없으면 401로 감추지 않고 config 오류', async () => {
    vi.stubEnv('FIREBASE_PROJECT_ID', '');
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', '');
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ k1: 'cert' })));
    const error = await verifyIdToken(tokenWithKid).catch((e) => e);
    expect(error).toBeInstanceOf(IdTokenVerifierError);
    expect(error.kind).toBe('config');
  });
});
