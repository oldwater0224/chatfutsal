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

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [prevUserId, setPrevUserId] = useState(userId);

  if (prevUserId !== userId) {
    setPrevUserId(userId);
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }

  const handleSnapshot = useCallback((snapshot: import("firebase/firestore").QuerySnapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Notification[];

    setNotifications(list);
    setUnreadCount(list.filter((n) => !n.isRead).length);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error("알림 조회 에러:", error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, handleSnapshot, handleError);

    return () => unsubscribe();
  }, [userId, handleSnapshot, handleError]);

  return { notifications, unreadCount, isLoading };
}
