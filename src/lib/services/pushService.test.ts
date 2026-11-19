import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  deleteDoc: vi.fn(),
  setDoc: vi.fn(),
}));
const messagingMocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  deleteToken: vi.fn(),
}));

vi.mock('../firebase', () => ({ auth: {}, db: {} }));
vi.mock('firebase/app', () => ({ getApp: vi.fn(() => ({})) }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...path: string[]) => ({ path: path.join('/') })),
  serverTimestamp: vi.fn(() => 'ts'),
  deleteDoc: firestoreMocks.deleteDoc,
  setDoc: firestoreMocks.setDoc,
}));
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(() => ({})),
  getToken: messagingMocks.getToken,
  deleteToken: messagingMocks.deleteToken,
  isSupported: vi.fn(async () => true),
}));

import {
  disablePush,
  isPushOptedOut,
  OPT_OUT_STORAGE_KEY,
  registerPushToken,
  SW_ACTIVATION_TIMEOUT_MS,
  UNREGISTER_TIMEOUT_MS,
  unregisterPushToken,
  waitForActiveWorker,
} from './pushService';

class FakeWorker extends EventTarget {
  constructor(public state: ServiceWorkerState) {
    super();
  }
  moveTo(state: ServiceWorkerState) {
    this.state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}

function fakeRegistration(parts: { active?: FakeWorker; installing?: FakeWorker; waiting?: FakeWorker }) {
  return {
    active: parts.active ?? null,
    installing: parts.installing ?? null,
    waiting: parts.waiting ?? null,
  } as unknown as ServiceWorkerRegistration;
}

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('waitForActiveWorker', () => {
  it('이미 활성 워커가 있으면 바로 등록 객체를 돌려준다', async () => {
    const reg = fakeRegistration({ active: new FakeWorker('activated') });
    await expect(waitForActiveWorker(reg)).resolves.toBe(reg);
  });

  it('설치 중인 워커가 activated가 되면 풀린다', async () => {
    const installing = new FakeWorker('installing');
    const reg = fakeRegistration({ installing });
    const pending = waitForActiveWorker(reg);
    let settled = false;
    pending.then(() => (settled = true));

    installing.moveTo('installed');
    installing.moveTo('activating');
    await Promise.resolve();
    expect(settled).toBe(false);

    installing.moveTo('activated');
    await expect(pending).resolves.toBe(reg);
  });

  it('대기 중인 워커도 activated를 기다린다', async () => {
    const waiting = new FakeWorker('installed');
    const reg = fakeRegistration({ waiting });
    const pending = waitForActiveWorker(reg);
    waiting.moveTo('activated');
    await expect(pending).resolves.toBe(reg);
  });

  it('워커가 redundant가 되면 실패한다', async () => {
    const installing = new FakeWorker('installing');
    const pending = waitForActiveWorker(fakeRegistration({ installing }));
    installing.moveTo('redundant');
    await expect(pending).rejects.toThrow('redundant');
  });

  it('제한 시간 안에 활성화되지 않으면 분명한 오류로 실패한다', async () => {
    const installing = new FakeWorker('installing');
    const pending = waitForActiveWorker(fakeRegistration({ installing }));
    const assertion = expect(pending).rejects.toThrow(`${SW_ACTIVATION_TIMEOUT_MS}ms 안에 활성화되지 않았습니다`);
    await vi.advanceTimersByTimeAsync(SW_ACTIVATION_TIMEOUT_MS);
    await assertion;
  });

  it('워커가 하나도 없으면 바로 실패한다', async () => {
    await expect(waitForActiveWorker(fakeRegistration({}))).rejects.toThrow();
  });
});

describe('registerPushToken', () => {
  it('서비스 워커가 활성화된 뒤에 getToken을 부른다', async () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_VAPID_KEY', 'vapid');
    vi.stubGlobal('localStorage', memoryStorage());
    const installing = new FakeWorker('installing');
    const reg = fakeRegistration({ installing });
    vi.stubGlobal('navigator', { serviceWorker: { register: vi.fn(async () => reg) } });
    messagingMocks.getToken.mockResolvedValue('tok');
    firestoreMocks.setDoc.mockResolvedValue(undefined);

    const pending = registerPushToken('alice');
    await vi.advanceTimersByTimeAsync(0);
    expect(messagingMocks.getToken).not.toHaveBeenCalled();

    installing.moveTo('activated');
    await expect(pending).resolves.toBe('tok');
    expect(messagingMocks.getToken).toHaveBeenCalledWith({}, { vapidKey: 'vapid', serviceWorkerRegistration: reg });
  });

  it('저장에 성공하면 "푸시 끔" 기록을 지운다', async () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_VAPID_KEY', 'vapid');
    const storage = memoryStorage();
    storage.setItem(OPT_OUT_STORAGE_KEY, '1');
    vi.stubGlobal('localStorage', storage);
    const reg = fakeRegistration({ active: new FakeWorker('activated') });
    vi.stubGlobal('navigator', { serviceWorker: { register: vi.fn(async () => reg) } });
    messagingMocks.getToken.mockResolvedValue('tok');
    firestoreMocks.setDoc.mockResolvedValue(undefined);

    await registerPushToken('alice');
    expect(isPushOptedOut()).toBe(false);
    expect(storage.getItem('chatfutsal:fcmToken')).toBe('tok');
  });

  it('저장에 실패하면 "푸시 끔" 기록을 남긴다', async () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_VAPID_KEY', 'vapid');
    const storage = memoryStorage();
    storage.setItem(OPT_OUT_STORAGE_KEY, '1');
    vi.stubGlobal('localStorage', storage);
    const reg = fakeRegistration({ active: new FakeWorker('activated') });
    vi.stubGlobal('navigator', { serviceWorker: { register: vi.fn(async () => reg) } });
    messagingMocks.getToken.mockResolvedValue('tok');
    firestoreMocks.setDoc.mockRejectedValue(new Error('offline'));

    await expect(registerPushToken('alice')).rejects.toThrow('offline');
    expect(isPushOptedOut()).toBe(true);
  });
});

describe('isPushOptedOut', () => {
  it('기록이 없으면 false, 있으면 true', () => {
    const storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
    expect(isPushOptedOut()).toBe(false);
    storage.setItem(OPT_OUT_STORAGE_KEY, '1');
    expect(isPushOptedOut()).toBe(true);
  });

  it('저장소 접근이 던지면 끄지 않은 것으로 본다', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError');
      },
    });
    expect(isPushOptedOut()).toBe(false);
  });
});

describe('disablePush', () => {
  function grantedDevice(currentToken: string) {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_VAPID_KEY', 'vapid');
    vi.stubGlobal('Notification', { permission: 'granted' });
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: vi.fn(async () => fakeRegistration({ active: new FakeWorker('activated') })) },
    });
    vi.stubGlobal('window', { Notification: {} });
    messagingMocks.getToken.mockResolvedValue(currentToken);
    messagingMocks.deleteToken.mockResolvedValue(true);
    firestoreMocks.deleteDoc.mockResolvedValue(undefined);
  }

  it('"푸시 끔"을 기록하고 토큰 문서와 FCM 토큰을 지운다', async () => {
    const storage = memoryStorage();
    storage.setItem('chatfutsal:fcmToken', 'tok');
    vi.stubGlobal('localStorage', storage);
    grantedDevice('tok');

    await disablePush();
    expect(isPushOptedOut()).toBe(true);
    expect(storage.getItem('chatfutsal:fcmToken')).toBeNull();
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith({ path: 'fcmTokens/tok' });
    expect(messagingMocks.deleteToken).toHaveBeenCalled();
  });

  it('오프라인이라 문서 삭제가 끝나지 않아도 제한 시간 안에 끝나고 reject하지 않는다', async () => {
    const storage = memoryStorage();
    storage.setItem('chatfutsal:fcmToken', 'tok');
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('Notification', { permission: 'default' });
    firestoreMocks.deleteDoc.mockReturnValue(new Promise(() => {}));

    const pending = disablePush();
    await vi.advanceTimersByTimeAsync(UNREGISTER_TIMEOUT_MS);
    await expect(pending).resolves.toBeUndefined();
    expect(isPushOptedOut()).toBe(true);
  });

  it('저장소를 못 써도 지금 기기 토큰의 문서와 FCM 토큰을 지운다', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    });
    grantedDevice('tok');

    await expect(disablePush()).resolves.toBeUndefined();
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith({ path: 'fcmTokens/tok' });
    expect(messagingMocks.deleteToken).toHaveBeenCalled();
    expect(isPushOptedOut()).toBe(false);
  });
});

describe('unregisterPushToken', () => {
  it('오프라인이라 deleteDoc이 끝나지 않아도 제한 시간 안에 끝난다', async () => {
    const storage = memoryStorage();
    storage.setItem('chatfutsal:fcmToken', 'tok');
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('Notification', { permission: 'default' });
    firestoreMocks.deleteDoc.mockReturnValue(new Promise(() => {}));

    let done = false;
    const pending = unregisterPushToken().then(() => (done = true));
    await vi.advanceTimersByTimeAsync(UNREGISTER_TIMEOUT_MS - 1);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(done).toBe(true);
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith({ path: 'fcmTokens/tok' });
    expect(storage.getItem('chatfutsal:fcmToken')).toBeNull();
  });

  it('삭제가 빨리 끝나면 제한 시간을 기다리지 않는다', async () => {
    const storage = memoryStorage();
    storage.setItem('chatfutsal:fcmToken', 'tok');
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('Notification', { permission: 'default' });
    firestoreMocks.deleteDoc.mockResolvedValue(undefined);

    await unregisterPushToken();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('삭제가 실패해도 reject하지 않는다', async () => {
    const storage = memoryStorage();
    storage.setItem('chatfutsal:fcmToken', 'tok');
    vi.stubGlobal('localStorage', storage);
    firestoreMocks.deleteDoc.mockRejectedValue(new Error('permission-denied'));
    // Notification이 없는 환경에서 deleteDeviceToken이 던져도 삼킨다
    await expect(unregisterPushToken()).resolves.toBeUndefined();
  });

  it('로그아웃은 "푸시 끔" 기록을 지우지 않는다', async () => {
    const storage = memoryStorage();
    storage.setItem('chatfutsal:fcmToken', 'tok');
    storage.setItem(OPT_OUT_STORAGE_KEY, '1');
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('Notification', { permission: 'default' });
    firestoreMocks.deleteDoc.mockResolvedValue(undefined);

    await unregisterPushToken();
    expect(isPushOptedOut()).toBe(true);
  });
});
