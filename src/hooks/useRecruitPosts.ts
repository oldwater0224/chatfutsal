'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RecruitPost } from "../types";
import { collection, onSnapshot, orderBy, query, where, QuerySnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { isPostExpired } from "../lib/utils/dateUtils";
import { selectPostsToClose } from "../lib/utils/recruitExpiry";
import { closeRecruitPost } from "../lib/services/recruitService";
import { selectPostsToCleanup } from "../lib/services/applicationRules";
import { closePendingApplications } from "../lib/services/applicationService";
import { useLivePagedQuery } from "./useLivePagedQuery";

const PAGE_SIZE = 20;
// 필터 결과를 채우려고 한 번에 자동으로 이어 받는 최대 페이지 수
const AUTO_FILL_PAGES = 5;

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
  // uid가 바뀌면 보안 규칙 판단이 달라지므로 다시 구독한다 (인증 확정 전에는 구독하지 않음)
  const subscriptionKey = ready ? (uid ?? "anonymous") : null;
  const buildQuery = useMemo(
    () =>
      subscriptionKey === null
        ? null
        : () => query(collection(db, 'recruitPosts'), where('status', '==', 'open'), orderBy('createdAt', 'desc')),
    [subscriptionKey],
  );
  const { docs, hasMore, loadMore, isLoading, loadingMore, error } = useLivePagedQuery(buildQuery, PAGE_SIZE);
  // 같은 세션에서 같은 글에 마감 쓰기를 반복하지 않도록 시도한 id를 기록한다
  const closeAttemptedRef = useRef<Set<string>>(new Set());

  const fetchedPosts = useMemo(
    () =>
      docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        updatedAt: d.data().updatedAt?.toDate() || new Date(),
      })) as RecruitPost[],
    [docs],
  );

  // 경기 시간이 지난 글은 Firestore에서도 마감한다.
  // 보안 규칙이 로그인 사용자의 status/updatedAt 변경만 허용하므로 비로그인은 건너뛴다.
  // 쿼리가 status=='open'이라 마감된 글은 다음 스냅샷에서 빠지며, 실패는 목록 렌더에 영향 주지 않도록 무시한다.
  useEffect(() => {
    if (!uid) return;
    for (const postId of selectPostsToClose(fetchedPosts, closeAttemptedRef.current)) {
      closeAttemptedRef.current.add(postId);
      closeRecruitPost(postId).catch(() => {});
    }
  }, [fetchedPosts, uid]);

  const permissionDenied = error?.code === "permission-denied";
  useEffect(() => {
    if (error && !permissionDenied) console.error("모집글 조회 에러:", error);
  }, [error, permissionDenied]);

  const date = filters?.date;
  const region = filters?.region;
  const level = filters?.level;
  const keyword = filters?.keyword;

  const posts = useMemo(() => {
    let result = fetchedPosts.filter((post) => !isPostExpired(post.date, post.time));

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
  }, [fetchedPosts, date, region, level, keyword]);

  // 필터·지역·검색어는 Firestore 쿼리로 표현할 수 없어(부분 일치 등) 받아온 글에 적용한다.
  // 대신 조건에 맞는 글이 목표 개수만큼 모일 때까지 다음 페이지를 자동으로 이어 받는다.
  // 목표는 더 보기를 누를 때마다 한 페이지씩 늘고, 한 번에 이어 받는 페이지 수는 제한한다.
  const filterKey = `${date}|${region}|${level}|${keyword}`;
  const [target, setTarget] = useState({ filterKey, value: PAGE_SIZE });
  const currentTarget = target.filterKey === filterKey ? target.value : PAGE_SIZE;
  const fillBudgetRef = useRef({ filterKey, target: currentTarget, left: AUTO_FILL_PAGES });
  const needsMore = !isLoading && !loadingMore && hasMore && posts.length < currentTarget;

  useEffect(() => {
    const budget = fillBudgetRef.current;
    if (budget.filterKey !== filterKey || budget.target !== currentTarget) {
      fillBudgetRef.current = { filterKey, target: currentTarget, left: AUTO_FILL_PAGES };
    }
    if (!needsMore || fillBudgetRef.current.left <= 0) return;
    fillBudgetRef.current.left--;
    loadMore();
  }, [needsMore, filterKey, currentTarget, loadMore]);

  const requestMore = useCallback(() => {
    setTarget({ filterKey, value: posts.length + PAGE_SIZE });
  }, [filterKey, posts.length]);

  return {
    posts,
    isLoading,
    permissionDenied,
    // 이어 받는 중에는 버튼 대신 진행 표시
    hasMore: hasMore && !loadingMore,
    loadingMore,
    loadMore: requestMore,
  };
}


// 내가 작성한 게시글
export function useMyRecruitPosts(userId: string | undefined){
  const [posts, setPosts] = useState<RecruitPost[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId);
  // 같은 세션에서 같은 글에 정리 쓰기를 반복하지 않도록 시도한 id를 기록한다
  const cleanupAttemptedRef = useRef<Set<string>>(new Set());

  const handleSnapshot = useCallback((snapshot: QuerySnapshot) => {
    const postList: RecruitPost[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as RecruitPost[];

    // 경기 시간 경과로 자동 마감된 글은, 마감을 수행한 사용자에게 남의 신청을 바꿀 권한이 없어
    // 대기 신청이 그대로 남는다. 권한이 있는 작성자가 자기 글 목록을 열 때 뒤늦게 정리한다.
    for (const post of selectPostsToCleanup(postList, cleanupAttemptedRef.current)) {
      cleanupAttemptedRef.current.add(post.id);
      closePendingApplications(post.id, post.title).catch(() => {});
    }

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
