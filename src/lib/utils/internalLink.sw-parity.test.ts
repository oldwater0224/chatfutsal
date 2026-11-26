// 서버 isInternalPath와 서비스 워커 safeLink가 같은 입력에 같은 판정을 하는지 확인한다
// 서비스 워커 파일을 고치지 않고 그대로 읽어 node:vm 컨텍스트에서 실행한 뒤 함수를 꺼내 쓴다
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, it, expect, beforeAll } from 'vitest';
import { isInternalPath } from './internalLink';
import { ALL_LINK_INPUTS } from './internalLink.cases';

const SW_PATH = path.resolve(__dirname, '../../../public/firebase-messaging-sw.js');
const APP_ORIGIN = 'https://app.test';
const FALLBACK_LINK = '/notifications';

type LinkFn = (link: unknown) => string;

// 서비스 워커 최상위 코드가 요구하는 최소 전역만 둔다
// 최상위에서는 self.addEventListener 호출만 일어나고, safeLink·resolveLink는 self.location.origin과 URL을 쓴다
function loadServiceWorker(): { safeLink: LinkFn; resolveLink: LinkFn } {
  const source = readFileSync(SW_PATH, 'utf8');
  const self = {
    location: { origin: APP_ORIGIN },
    addEventListener: () => {},
  };
  const context = vm.createContext({ self, URL });
  vm.runInContext(source, context, { filename: SW_PATH });

  const { safeLink, resolveLink } = context as { safeLink?: unknown; resolveLink?: unknown };
  if (typeof safeLink !== 'function') {
    throw new Error(`${SW_PATH}에서 최상위 함수 safeLink를 찾지 못했습니다`);
  }
  if (typeof resolveLink !== 'function') {
    throw new Error(`${SW_PATH}에서 최상위 함수 resolveLink를 찾지 못했습니다`);
  }
  return { safeLink: safeLink as LinkFn, resolveLink: resolveLink as LinkFn };
}

// 테스트 이름에 출력 불가 문자가 그대로 찍히지 않게 문자열은 JSON 표기로 보여 준다
// JSON.stringify는 \u0000-\u001F만 이스케이프하므로 DEL·C1 제어 문자(\u007F-\u009F)와
// 줄·문단 구분자(\u2028·\u2029)는 \uXXXX로 직접 바꾼다
const escapeUnprintable = (text: string) =>
  text.replace(
    /[\u007F-\u009F\u2028\u2029]/g,
    (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );

const label = (input: unknown) => {
  if (typeof input === 'string') return escapeUnprintable(JSON.stringify(input));
  return typeof input === 'object' && input ? 'object' : String(input);
};

describe('서비스 워커 safeLink와 isInternalPath 판정 일치', () => {
  let sw: { safeLink: LinkFn; resolveLink: LinkFn };

  beforeAll(() => {
    sw = loadServiceWorker();
  });

  it('검사 입력은 25개다', () => {
    expect(ALL_LINK_INPUTS).toHaveLength(25);
  });

  it.each(ALL_LINK_INPUTS.map((input) => [label(input), input]))(
    'safeLink가 isInternalPath와 같은 판정을 한다: %s',
    (_name, input) => {
      const expected = isInternalPath(input) ? input : FALLBACK_LINK;
      expect(sw.safeLink(input)).toBe(expected);
    },
  );

  it.each(ALL_LINK_INPUTS.map((input) => [label(input), input]))(
    'resolveLink는 앱 출처 밖으로 나가지 않는다: %s',
    (_name, input) => {
      const url = new URL(sw.resolveLink(input));
      expect(url.origin).toBe(APP_ORIGIN);
      expect(url.pathname.startsWith('//')).toBe(false);
    },
  );
});
