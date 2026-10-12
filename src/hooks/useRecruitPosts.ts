'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { RecruitPost } from "../types";
import { collection, onSnapshot, orderBy, query, where, FirestoreError, QuerySnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { isPostExpired } from "../lib/utils/dateUtils";

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
  const [allPosts, setAllPosts] = useState<RecruitPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const handleSnapshot = useCallback((snapshot: QuerySnapshot) => {
    const postList: RecruitPost[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() || new Date(),
      updatedAt: d.data().updatedAt?.toDate() || new Date(),
    })) as RecruitPost[];

    setAllPosts(postList.filter((post) => !isPostExpired(post.date, post.time)));
    setPermissionDenied(false);
    setIsLoading(false);
  }, []);

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
    if (!auth.ready) return;

    const postRef = collection(db, 'recruitPosts');
    const q = query(postRef,
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, handleSnapshot, handleError);
    return () => unsubscribe();
  }, [auth.ready, auth.uid, handleSnapshot, handleError]);

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

  return { posts, isLoading, permissionDenied };
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
