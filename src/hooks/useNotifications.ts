"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  limit as limitTo,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Notification } from "../types";
import { hasMorePages, usePageLimit } from "./usePageLimit";

const PAGE_SIZE = 20;
// 안 읽은 알림 수는 이 개수까지만 센다 (배지는 99+로 표시)
const UNREAD_COUNT_LIMIT = 100;

// 스냅샷 결과를 소유 userId와 함께 보관해, 유저가 바뀌는 순간 이전 데이터가 노출되지 않게 한다
interface NotificationState {
  ownerId: string | undefined;
  list: Notification[];
  fetched: number;
  isLoading: boolean;
}

// 알림 목록 (최근 PAGE_SIZE개부터, 더 보기로 확장)
export function useNotifications(userId: string | undefined) {
  const { limit, loadMore } = usePageLimit(PAGE_SIZE, userId);
  const [state, setState] = useState<NotificationState>({
    ownerId: userId,
    list: [],
    fetched: 0,
    isLoading: !!userId,
  });

  const handleSnapshot = useCallback((ownerId: string, snapshot: QuerySnapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Notification[];

    setState({ ownerId, list, fetched: snapshot.size, isLoading: false });
  }, []);

  const handleError = useCallback((ownerId: string, error: Error) => {
    console.error("알림 조회 에러:", error);
    setState({ ownerId, list: [], fetched: 0, isLoading: false });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      orderBy("createdAt", "desc"),
      limitTo(limit),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => handleSnapshot(userId, snapshot),
      (error) => handleError(userId, error),
    );

    return () => unsubscribe();
  }, [userId, limit, handleSnapshot, handleError]);

  // 보관된 결과가 현재 userId의 것일 때만 사용 (유저 전환/로그아웃 시 즉시 초기화)
  const isCurrent = state.ownerId === userId;
  const notifications = isCurrent ? state.list : [];

  return {
    notifications,
    hasMore: isCurrent && hasMorePages(state.fetched, limit),
    loadMore,
    isLoading: userId ? (isCurrent ? state.isLoading : true) : false,
  };
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
