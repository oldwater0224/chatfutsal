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

// 실시간 구간 뒤에 이어 받은 문서를 붙인다. 같은 문서는 실시간 쪽(최신 상태)을 쓴다.
export function mergePages<T extends { id: string }>(head: T[], tail: T[]): T[] {
  const headIds = new Set(head.map((d) => d.id));
  return [...head, ...tail.filter((d) => !headIds.has(d.id))];
}
