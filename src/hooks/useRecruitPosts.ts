'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RecruitPost } from "../types";
import { collection, limit as limitTo, onSnapshot, orderBy, query, where, FirestoreError, QuerySnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { isPostExpired } from "../lib/utils/dateUtils";
import { selectPostsToClose } from "../lib/utils/recruitExpiry";
import { closeRecruitPost } from "../lib/services/recruitService";
import { hasMorePages, usePageLimit } from "./usePageLimit";

const PAGE_SIZE = 20;

interface RecruitFilters {
  date: string;
  region: string;
  level: string;
  keyword: string;
}

interface RecruitPostsAuth {
  // 인증 상태가 확정되기 전에 구독하면 보안 규칙에 거부되고 재시도되지 않는다
  ready: boolean;
  uid?: string;
}

export function useRecruitPosts(filters: RecruitFilters | undefined, auth: RecruitPostsAuth){
  const { ready, uid } = auth;
  const { limit, loadMore } = usePageLimit(PAGE_SIZE, uid);
  const [allPosts, setAllPosts] = useState<RecruitPost[]>([]);
  const [fetchedCount, setFetchedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  // 같은 세션에서 같은 글에 마감 쓰기를 반복하지 않도록 시도한 id를 기록한다
  const closeAttemptedRef = useRef<Set<string>>(new Set());

  const handleSnapshot = useCallback((snapshot: QuerySnapshot) => {
    const postList: RecruitPost[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() || new Date(),
      updatedAt: d.data().updatedAt?.toDate() || new Date(),
    })) as RecruitPost[];

    // 경기 시간이 지난 글은 Firestore에서도 마감한다.
    // 보안 규칙이 로그인 사용자의 status/updatedAt 변경만 허용하므로 비로그인은 건너뛴다.
    // 쿼리가 status=='open'이라 마감된 글은 스냅샷에서 빠지며, 실패는 목록 렌더에 영향 주지 않도록 무시한다.
    if (uid) {
      for (const postId of selectPostsToClose(postList, closeAttemptedRef.current)) {
        closeAttemptedRef.current.add(postId);
        closeRecruitPost(postId).catch(() => {});
      }
    }

    setAllPosts(postList.filter((post) => !isPostExpired(post.date, post.time)));
    setFetchedCount(snapshot.size);
    setPermissionDenied(false);
    setIsLoading(false);
  }, [uid]);

  const handleError = useCallback((error: FirestoreError) => {
    if (error.code === "permission-denied") {
      setAllPosts([]);
      setPermissionDenied(true);
    } else {
      console.error("모집글 조회 에러:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const postRef = collection(db, 'recruitPosts');
    const q = query(postRef,
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
      limitTo(limit)
    );

    const unsubscribe = onSnapshot(q, handleSnapshot, handleError);
    return () => unsubscribe();
  }, [ready, uid, limit, handleSnapshot, handleError]);

  const date = filters?.date;
  const region = filters?.region;
  const level = filters?.level;
  const keyword = filters?.keyword;

  const posts = useMemo(() => {
    let result = allPosts;

    if (date) {
      result = result.filter((post) => post.date === date);
    }
    if (region) {
      result = result.filter((post) => post.locationCoord?.address?.includes(region));
    }
    if (level) {
      result = result.filter((post) => post.level === level);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(kw) ||
          post.content.toLowerCase().includes(kw) ||
          post.location.toLowerCase().includes(kw)
      );
    }

    return result;
  }, [allPosts, date, region, level, keyword]);

  // 필터는 받아온 범위 안에서만 적용되므로, 결과가 적어도 서버에 글이 더 있으면 더 보기를 노출한다
  return { posts, isLoading, permissionDenied, hasMore: hasMorePages(fetchedCount, limit), loadMore };
}


// 내가 작성한 게시글
export function useMyRecruitPosts(userId: string | undefined){
  const [posts, setPosts] = useState<RecruitPost[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId);

  const handleSnapshot = useCallback((snapshot: QuerySnapshot) => {
    const postList: RecruitPost[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as RecruitPost[];

    setPosts(postList);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error("내 게시글 조회 에러:", error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if(!userId) return;

    const postsRef = collection(db, 'recruitPosts');
    const q = query(
      postsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, handleSnapshot, handleError);
    return () => unsubscribe();
  }, [userId, handleSnapshot, handleError]);

  return { posts, isLoading };
}
