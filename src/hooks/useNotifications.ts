"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { applyLocalRead } from "./pagedQuery";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../lib/services/notificationService";

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
  const { docs, canLoadMore, loadMore, isLoading } = useLivePagedQuery(buildQuery, PAGE_SIZE, "알림");

  // 이전 페이지의 알림은 한 번 읽은 값이라 읽음 처리가 반영되지 않는다.
  // 이 화면에서 읽음 처리한 알림은 서버 반영과 별개로 바로 읽음으로 표시한다.
  const [localRead, setLocalRead] = useState<{ ownerId: string | undefined; ids: ReadonlySet<string> }>({
    ownerId: userId,
    ids: new Set(),
  });
  const readIds = localRead.ownerId === userId ? localRead.ids : EMPTY_IDS;

  const notifications = useMemo(
    () =>
      applyLocalRead(
        docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Notification[],
        readIds,
      ),
    [docs, readIds],
  );

  const markRead = useCallback(
    async (notificationId: string) => {
      setLocalRead((prev) => ({
        ownerId: userId,
        ids: new Set([...(prev.ownerId === userId ? prev.ids : []), notificationId]),
      }));
      await markNotificationAsRead(notificationId);
    },
    [userId],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const loadedIds = notifications.map((n) => n.id);
    setLocalRead((prev) => ({
      ownerId: userId,
      ids: new Set([...(prev.ownerId === userId ? prev.ids : []), ...loadedIds]),
    }));
    await markAllNotificationsAsRead(userId);
  }, [userId, notifications]);

  return { notifications, hasMore: canLoadMore, loadMore, isLoading, markRead, markAllRead };
}

const EMPTY_IDS: ReadonlySet<string> = new Set();

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
