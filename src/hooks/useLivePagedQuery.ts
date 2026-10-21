"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  endAt,
  FirestoreError,
  getDocs,
  limit,
  onSnapshot,
  Query,
  query,
  QueryDocumentSnapshot,
  startAfter,
} from "firebase/firestore";
import { computeHasMore, mergePages } from "./pagedQuery";

// 첫 페이지만 실시간으로 구독하고, 이전 페이지는 커서로 한 번씩만 읽는다.
// limit을 늘려 다시 구독하면 앞 페이지까지 매번 다시 읽히므로(20+40+…) 그 비용을 없앤다.
//
// 더 보기를 처음 누르는 순간 실시간 구간의 끝을 그때의 마지막 문서로 고정(endAt)한다.
// 고정하지 않으면 새 문서가 들어올 때 경계 문서가 limit 밖으로 밀려나, 이미 받은 이전 페이지와의
// 사이에서 빠지게 된다. 고정 후에는 새 문서가 들어와도 실시간 구간이 늘어날 뿐 빠지는 문서가 없다.
//
// 이전 페이지는 한 번 읽은 값이라 이후 변경(마감·삭제 등)은 새로고침 전까지 반영되지 않는다.
//
// buildQuery는 정렬(orderBy)을 포함한 기준 쿼리를 만든다. 바뀌면(유저·방 전환) 처음부터 다시 받는다.
export function useLivePagedQuery(buildQuery: (() => Query) | null, pageSize: number) {
  const initial = useCallback(
    (source: (() => Query) | null): PagedState => ({
      source,
      head: [],
      tail: [],
      anchor: null,
      tailExhausted: false,
      headLoaded: false,
      loadingMore: false,
      error: null,
    }),
    [],
  );

  const [state, setState] = useState<PagedState>(() => initial(buildQuery));
  // 보관된 결과가 현재 쿼리의 것일 때만 사용 (유저·방 전환 시 이전 데이터가 보이지 않게)
  const current = state.source === buildQuery ? state : initial(buildQuery);
  const { anchor } = current;

  useEffect(() => {
    if (!buildQuery) return;
    const base = buildQuery();
    const q = anchor ? query(base, endAt(anchor)) : query(base, limit(pageSize));

    const own = (prev: PagedState) => (prev.source === buildQuery ? prev : initial(buildQuery));
    return onSnapshot(
      q,
      (snap) => setState((prev) => ({ ...own(prev), head: snap.docs, headLoaded: true, error: null })),
      (error) => setState((prev) => ({ ...own(prev), headLoaded: true, error })),
    );
  }, [buildQuery, anchor, pageSize, initial]);

  const hasMore = computeHasMore({
    pageSize,
    headCount: current.head.length,
    anchored: anchor !== null,
    tailExhausted: current.tailExhausted,
  });

  const loadMore = useCallback(async () => {
    if (!buildQuery || current.loadingMore || !hasMore) return;
    const cursor = current.tail.at(-1) ?? current.head.at(-1);
    if (!cursor) return;

    setState((prev) => {
      const p = prev.source === buildQuery ? prev : initial(buildQuery);
      return { ...p, loadingMore: true, anchor: p.anchor ?? p.head.at(-1) ?? null };
    });

    try {
      const snap = await getDocs(query(buildQuery(), startAfter(cursor), limit(pageSize)));
      setState((prev) =>
        prev.source !== buildQuery
          ? prev
          : {
              ...prev,
              tail: [...prev.tail, ...snap.docs],
              tailExhausted: snap.size < pageSize,
              loadingMore: false,
            },
      );
    } catch (error) {
      setState((prev) =>
        prev.source !== buildQuery
          ? prev
          : { ...prev, loadingMore: false, error: error as FirestoreError },
      );
    }
  }, [buildQuery, current.loadingMore, current.tail, current.head, hasMore, pageSize, initial]);

  const docs = useMemo(() => mergePages(current.head, current.tail), [current.head, current.tail]);

  return {
    docs,
    hasMore,
    loadMore,
    isLoading: buildQuery ? !current.headLoaded : false,
    loadingMore: current.loadingMore,
    error: current.error,
  };
}

interface PagedState {
  source: (() => Query) | null;
  head: QueryDocumentSnapshot[];
  tail: QueryDocumentSnapshot[];
  anchor: QueryDocumentSnapshot | null;
  tailExhausted: boolean;
  headLoaded: boolean;
  loadingMore: boolean;
  error: FirestoreError | null;
}
