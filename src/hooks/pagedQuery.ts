// 실시간 첫 페이지 + 커서로 이어 받는 이전 페이지를 합치는 규칙 (Firestore에 의존하지 않는 순수 함수)

export interface PagingState {
  pageSize: number;
  headCount: number; // 실시간 구간에서 받은 문서 수
  anchored: boolean; // 더 보기를 한 번이라도 눌러 실시간 구간 끝을 고정했는지
  tailExhausted: boolean; // 마지막으로 이어 받은 페이지가 pageSize보다 적었는지
}

// 다음 페이지가 있을 수 있는지
export function computeHasMore(s: PagingState): boolean {
  if (s.anchored) return !s.tailExhausted;
  // 고정 전에는 실시간 구간이 limit(pageSize)이므로 꽉 찼으면 더 있을 수 있다
  return s.headCount >= s.pageSize;
}

// 실시간 구간 뒤에 이어 받은 문서를 붙인다. 같은 문서는 실시간 쪽(최신 상태)을 쓰고,
// 이어 받은 구간 안에서 겹치는 문서는 처음 받은 것만 남긴다.
export function mergePages<T extends { id: string }>(head: T[], tail: T[]): T[] {
  const seen = new Set(head.map((d) => d.id));
  const rest: T[] = [];
  for (const d of tail) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    rest.push(d);
  }
  return [...head, ...rest];
}

// 실시간 구간을 고정하며 다시 연 구독의 결과를 그대로 반영할지.
// 새 구독의 첫 결과가 캐시에서 온 일부(기존보다 적음)면, 서버 결과가 올 때까지 기존 목록을 유지해
// 목록이 잠깐 줄었다 돌아오는 깜빡임을 막는다.
export function shouldKeepPreviousHead(s: {
  anchored: boolean;
  fromCache: boolean;
  serverSeen: boolean;
  nextCount: number;
  prevCount: number;
}): boolean {
  return s.anchored && s.fromCache && !s.serverSeen && s.nextCount < s.prevCount;
}

// 실시간 구독 오류 시 받아 둔 목록을 비울지. 권한이 없어진 경우에는 더 이상 보여 주면 안 된다.
export function clearsListOnError(code: string): boolean {
  return code === "permission-denied";
}

// 화면에서 읽음 처리한 항목을 읽음으로 표시한다 (한 번 읽은 이전 페이지 값을 덮어씀)
export function applyLocalRead<T extends { id: string; isRead: boolean }>(
  items: T[],
  readIds: ReadonlySet<string>,
): T[] {
  if (readIds.size === 0) return items;
  return items.map((item) => (item.isRead || !readIds.has(item.id) ? item : { ...item, isRead: true }));
}
