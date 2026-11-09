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

// 스냅샷 결과를 원본 postId와 함께 보관해, postId가 바뀌거나 undefined(로그아웃)가 되는 순간
// 이전 목록이 노출되지 않게 한다 (useChatRooms의 ownerId 패턴)
interface PostApplicationsState {
  postId: string | undefined;
  applications: Application[];
  isLoading: boolean;
}

export function usePostApplications(postId: string | undefined) {
  const [state, setState] = useState<PostApplicationsState>({
    postId,
    applications: [],
    isLoading: !!postId,
  });

  const handleSnapshot = useCallback((sourcePostId: string, snapshot: QuerySnapshot) => {
    setState({ postId: sourcePostId, applications: mapApplications(snapshot), isLoading: false });
  }, []);

  const handleError = useCallback((sourcePostId: string, error: Error) => {
    console.error("신청 목록 조회 에러:", error);
    setState({ postId: sourcePostId, applications: [], isLoading: false });
  }, []);

  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, "applications"),
      where("postId", "==", postId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => handleSnapshot(postId, snapshot),
      (error) => handleError(postId, error),
    );
    return () => unsubscribe();
  }, [postId, handleSnapshot, handleError]);

  // 보관된 결과가 현재 postId의 것일 때만 사용
  const isCurrent = !!postId && state.postId === postId;

  return {
    applications: isCurrent ? state.applications : [],
    isLoading: postId ? (isCurrent ? state.isLoading : true) : false,
  };
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
