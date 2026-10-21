"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  limit as limitTo,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Notification } from "../types";
import { useLivePagedQuery } from "./useLivePagedQuery";

const PAGE_SIZE = 20;
// 안 읽은 알림 수는 이 개수까지만 센다 (배지는 99+로 표시)
const UNREAD_COUNT_LIMIT = 100;

// 알림 목록 (최근 PAGE_SIZE개는 실시간, 이전 알림은 더 보기로 한 번씩 읽음)
// 유저가 바뀌면 buildQuery가 바뀌어 이전 유저의 결과는 즉시 보이지 않는다
export function useNotifications(userId: string | undefined) {
  const buildQuery = useMemo(
    () =>
      userId
        ? () =>
            query(
              collection(db, "notifications"),
              where("recipientId", "==", userId),
              orderBy("createdAt", "desc"),
            )
        : null,
    [userId],
  );
  const { docs, hasMore, loadMore, isLoading, loadingMore, error } = useLivePagedQuery(buildQuery, PAGE_SIZE);

  useEffect(() => {
    if (error) console.error("알림 조회 에러:", error);
  }, [error]);

  const notifications = useMemo(
    () =>
      docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Notification[],
    [docs],
  );

  return { notifications, hasMore: hasMore && !loadingMore, loadMore, isLoading };
}

// 안 읽은 알림 수 (헤더 배지 등). 목록 페이지 범위와 무관하게 센다.
export function useUnreadNotificationCount(userId: string | undefined) {
  const [state, setState] = useState<{ ownerId: string | undefined; count: number }>({
    ownerId: userId,
    count: 0,
  });

  useEffect(() => {
    if (!userId) return;

    // 등호 조건만 사용해 복합 색인 없이 동작한다
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      where("isRead", "==", false),
      limitTo(UNREAD_COUNT_LIMIT),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setState({ ownerId: userId, count: snapshot.size }),
      (error) => {
        console.error("안 읽은 알림 수 조회 에러:", error);
        setState({ ownerId: userId, count: 0 });
      },
    );
    return () => unsubscribe();
  }, [userId]);

  return state.ownerId === userId ? state.count : 0;
}
