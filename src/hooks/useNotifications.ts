"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Notification } from "../types";

// 스냅샷 결과를 소유 userId와 함께 보관해, 유저가 바뀌는 순간 이전 데이터가 노출되지 않게 한다
interface NotificationState {
  ownerId: string | undefined;
  list: Notification[];
  isLoading: boolean;
}

export function useNotifications(userId: string | undefined) {
  const [state, setState] = useState<NotificationState>({
    ownerId: userId,
    list: [],
    isLoading: !!userId,
  });

  const handleSnapshot = useCallback(
    (ownerId: string, snapshot: import("firebase/firestore").QuerySnapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Notification[];

      setState({ ownerId, list, isLoading: false });
    },
    [],
  );

  const handleError = useCallback((ownerId: string, error: Error) => {
    console.error("알림 조회 에러:", error);
    setState({ ownerId, list: [], isLoading: false });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => handleSnapshot(userId, snapshot),
      (error) => handleError(userId, error),
    );

    return () => unsubscribe();
  }, [userId, handleSnapshot, handleError]);

  // 보관된 결과가 현재 userId의 것일 때만 사용 (유저 전환/로그아웃 시 즉시 초기화)
  const isCurrent = state.ownerId === userId;
  const notifications = isCurrent ? state.list : [];

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    isLoading: userId ? (isCurrent ? state.isLoading : true) : false,
  };
}
