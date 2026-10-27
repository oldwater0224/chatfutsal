"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { clearsListOnError, computeHasMore, mergePages, shouldKeepPreviousHead } from "./pagedQuery";

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
// label은 오류 로그에 쓴다.
export function useLivePagedQuery(buildQuery: (() => Query) | null, pageSize: number, label: string) {
  const [state, setState] = useState<PagedState>(() => initialState(buildQuery));
  // 보관된 결과가 현재 쿼리의 것일 때만 사용 (유저·방 전환 시 이전 데이터가 보이지 않게)
  const current = ownState(state, buildQuery);
  const { anchor } = current;

  useEffect(() => {
    if (!buildQuery) return;
    const base = buildQuery();
    const anchored = anchor !== null;
    const q = anchored ? query(base, endAt(anchor)) : query(base, limit(pageSize));
    let serverSeen = false;

    return onSnapshot(
      q,
      // 고정 후 다시 연 구독은 캐시 결과와 서버 결과를 구분해야 하므로 메타데이터 변경도 받는다
      { includeMetadataChanges: anchored },
      (snap) => {
        const fromCache = snap.metadata.fromCache;
        const seenBefore = serverSeen;
        setState((prev) => {
          const p = ownState(prev, buildQuery);
          if (
            shouldKeepPreviousHead({
              anchored,
              fromCache,
              serverSeen: seenBefore,
              nextCount: snap.size,
              prevCount: p.head.length,
            })
          ) {
            return p;
          }
          return { ...p, head: snap.docs, headLoaded: true, error: null };
        });
        if (!fromCache) serverSeen = true;
      },
      (error) => {
        console.error(`${label} 조회 에러:`, error);
        setState((prev) => {
          const p = ownState(prev, buildQuery);
          return clearsListOnError(error.code)
            ? { ...p, head: [], tail: [], headLoaded: true, error }
            : { ...p, headLoaded: true, error };
        });
      },
    );
  }, [buildQuery, anchor, pageSize, label]);

  const hasMore = computeHasMore({
    pageSize,
    headCount: current.head.length,
    anchored: anchor !== null,
    tailExhausted: current.tailExhausted,
  });

  // 진행 중인 이어 받기와 다음 커서는 ref로 관리한다.
  // 렌더 시점 값으로 판단하면, 화면이 갱신되기 전에 두 번 불릴 때 같은 페이지를 두 번 받는다.
  const pagingRef = useRef<{ source: (() => Query) | null; inFlight: boolean; cursor: QueryDocumentSnapshot | null }>({
    source: null,
    inFlight: false,
    cursor: null,
  });

  // 이어 받기를 시작했으면 true (자동 이어 받기 한도 계산에 사용)
  const loadMore = useCallback((): boolean => {
    if (!buildQuery || !hasMore) return false;
    if (pagingRef.current.source !== buildQuery) {
      pagingRef.current = { source: buildQuery, inFlight: false, cursor: null };
    }
    const paging = pagingRef.current;
    if (paging.inFlight) return false;

    // 첫 이어 받기의 커서는 지금 보이는 실시간 구간의 마지막 문서이고, 같은 문서를 앵커로 쓴다.
    // 둘이 같아야 endAt(앵커)와 startAfter(커서) 사이에 빠지는 문서가 없다.
    const cursor = paging.cursor ?? current.head.at(-1);
    if (!cursor) return false;
    const isFirst = paging.cursor === null;
    paging.inFlight = true;
    paging.cursor = cursor;

    setState((prev) => {
      const p = ownState(prev, buildQuery);
      return { ...p, loadingMore: true, loadError: null, anchor: isFirst ? cursor : p.anchor };
    });

    getDocs(query(buildQuery(), startAfter(cursor), limit(pageSize)))
      .then((snap) => {
        if (pagingRef.current.source !== buildQuery) return;
        paging.cursor = snap.docs.at(-1) ?? cursor;
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
      })
      .catch((loadError: FirestoreError) => {
        console.error(`${label} 이전 페이지 조회 에러:`, loadError);
        if (pagingRef.current.source !== buildQuery) return;
        // 커서는 그대로 두어 다시 누르면 같은 페이지부터 재시도한다
        setState((prev) => (prev.source !== buildQuery ? prev : { ...prev, loadingMore: false, loadError }));
      })
      .finally(() => {
        if (pagingRef.current.source === buildQuery) paging.inFlight = false;
      });

    return true;
  }, [buildQuery, hasMore, current.head, pageSize, label]);

  const docs = useMemo(() => mergePages(current.head, current.tail), [current.head, current.tail]);

  return {
    docs,
    hasMore,
    // 더 보기 버튼 노출 여부 (불러오는 중에는 숨김)
    canLoadMore: hasMore && !current.loadingMore,
    loadMore,
    isLoading: buildQuery ? !current.headLoaded : false,
    loadingMore: current.loadingMore,
    // 실시간 구독 오류 (권한 등)
    error: current.error,
    // 이전 페이지 이어 받기 오류
    loadError: current.loadError,
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
  loadError: FirestoreError | null;
}

function initialState(source: (() => Query) | null): PagedState {
  return {
    source,
    head: [],
    tail: [],
    anchor: null,
    tailExhausted: false,
    headLoaded: false,
    loadingMore: false,
    error: null,
    loadError: null,
  };
}

// 보관된 상태가 현재 쿼리의 것이면 그대로, 아니면 초기 상태
function ownState(state: PagedState, source: (() => Query) | null): PagedState {
  return state.source === source ? state : initialState(source);
}
