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

// 스냅샷 결과를 조회 키(postId·보는 사람·역할)와 함께 보관해, 키가 바뀌거나 undefined(로그아웃)가 되는 순간
// 이전 목록이 노출되지 않게 한다 (useChatRooms의 ownerId 패턴)
interface PostApplicationsState {
  key: string | null;
  applications: Application[];
  isLoading: boolean;
}

// 보안 규칙상 신청 문서는 신청자 본인과 모집글 작성자만 읽을 수 있어,
// 목록 쿼리도 그 조건(authorId 또는 applicantId == 내 uid)을 걸어야 통과한다.
// - 작성자(isAuthor === true): 이 글의 모든 신청
// - 그 외(isAuthor === false): 이 글에 대한 내 신청만 (신청 취소에 쓴다)
// 셋 중 하나라도 정해지지 않았으면(로그아웃, 모집글 로딩 전) 구독하지 않는다.
export function usePostApplications(
  postId: string | undefined,
  viewerUid: string | undefined,
  isAuthor: boolean | undefined,
) {
  const key =
    postId && viewerUid && isAuthor !== undefined
      ? `${postId}|${viewerUid}|${isAuthor ? "author" : "applicant"}`
      : null;

  const [state, setState] = useState<PostApplicationsState>({
    key,
    applications: [],
    isLoading: key !== null,
  });

  const handleSnapshot = useCallback((sourceKey: string, snapshot: QuerySnapshot) => {
    setState({ key: sourceKey, applications: mapApplications(snapshot), isLoading: false });
  }, []);

  const handleError = useCallback((sourceKey: string, error: Error) => {
    console.error("신청 목록 조회 에러:", error);
    setState({ key: sourceKey, applications: [], isLoading: false });
  }, []);

  useEffect(() => {
    if (!key || !postId || !viewerUid || isAuthor === undefined) return;

    const q = query(
      collection(db, "applications"),
      where("postId", "==", postId),
      where(isAuthor ? "authorId" : "applicantId", "==", viewerUid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => handleSnapshot(key, snapshot),
      (error) => handleError(key, error),
    );
    return () => unsubscribe();
  }, [key, postId, viewerUid, isAuthor, handleSnapshot, handleError]);

  // 보관된 결과가 현재 키의 것일 때만 사용
  const isCurrent = key !== null && state.key === key;

  return {
    applications: isCurrent ? state.applications : [],
    isLoading: key !== null ? (isCurrent ? state.isLoading : true) : false,
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
