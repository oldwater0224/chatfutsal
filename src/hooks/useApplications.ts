"use client";

import { useCallback, useEffect, useState } from "react";
import { Application } from "../types";
import { collection, onSnapshot, orderBy, query, where, QuerySnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

function mapApplications(snapshot: QuerySnapshot): Application[] {
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Application[];
}

export function usePostApplications(postId: string | undefined) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(!!postId);

  const handleSnapshot = useCallback((snapshot: QuerySnapshot) => {
    setApplications(mapApplications(snapshot));
    setIsLoading(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error("신청 목록 조회 에러:", error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, "applications"),
      where("postId", "==", postId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, handleSnapshot, handleError);
    return () => unsubscribe();
  }, [postId, handleSnapshot, handleError]);

  return { applications, isLoading };
}

export function useMyApplications(userId: string | undefined) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId);

  const handleSnapshot = useCallback((snapshot: QuerySnapshot) => {
    setApplications(mapApplications(snapshot));
    setIsLoading(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error("내 신청 내역 조회 에러:", error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "applications"),
      where("applicantId", "==", userId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, handleSnapshot, handleError);
    return () => unsubscribe();
  }, [userId, handleSnapshot, handleError]);

  return { applications, isLoading };
}
