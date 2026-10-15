"use client";

import { useCallback, useState } from "react";

// 실시간 구독 쿼리의 limit을 "더 보기"로 늘려가는 상태.
// resetKey(유저·방 등)가 바뀌면 첫 페이지 크기로 돌아간다. effect 안에서 setState하지 않도록 key와 함께 보관한다.
export function usePageLimit(pageSize: number, resetKey?: string) {
  const [state, setState] = useState({ key: resetKey, limit: pageSize });
  const limit = state.key === resetKey ? state.limit : pageSize;

  const loadMore = useCallback(() => {
    setState({ key: resetKey, limit: limit + pageSize });
  }, [resetKey, limit, pageSize]);

  return { limit, loadMore };
}

// limit만큼 꽉 차게 받아왔으면 더 있을 수 있다
export function hasMorePages(fetched: number, limit: number): boolean {
  return fetched >= limit;
}
