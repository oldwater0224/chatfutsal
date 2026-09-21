'use client'

import { useCallback, useEffect, useState } from "react"
import { RecruitPost } from "../types";
import { collection, onSnapshot, orderBy, query, where, QuerySnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

interface RecruitFilters {
  date: string;
  region: string;
  level: string;
  keyword: string;
}

export function useRecruitPosts(filters?: RecruitFilters){
  const [posts , setPosts] = useState<RecruitPost[]>([]);
  const [isLoading , setIsLoading] = useState(true);

  const handleSnapshot = useCallback((snapshot: QuerySnapshot) => {
    let postList : RecruitPost[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt : doc.data().createdAt?.toDate() || new Date(),
      updatedAt : doc.data().updatedAt?.toDate() || new Date(),
    })) as RecruitPost[];

    if (filters?.date) {
      postList = postList.filter((post) => post.date === filters.date);
    }
    if (filters?.region) {
      postList = postList.filter((post) =>
        post.locationCoord?.address?.includes(filters.region)
      );
    }
    if (filters?.level) {
      postList = postList.filter((post) => post.level === filters.level);
    }
    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase();
      postList = postList.filter(
        (post) =>
          post.title.toLowerCase().includes(kw) ||
          post.content.toLowerCase().includes(kw) ||
          post.location.toLowerCase().includes(kw)
      );
    }

    setPosts(postList);
    setIsLoading(false);
  }, [filters?.date, filters?.region, filters?.level, filters?.keyword]);

  const handleError = useCallback((error: Error) => {
    console.error("모집글 조회 에러:", error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const postRef = collection(db , 'recruitPosts');
    const q = query(postRef ,
      where('status' , '==' , 'open') ,
      orderBy('createdAt' , 'desc')
    );

    const unsubscribe = onSnapshot(q, handleSnapshot, handleError);
    return () => unsubscribe();
  } , [handleSnapshot, handleError])

  return {posts , isLoading};
}


// 내가 작성한 게시글
export function useMyRecruitPosts(userId : string | undefined){
  const [posts , setPosts] = useState<RecruitPost[]>([]);
  const [isLoading , setIsLoading] = useState(!!userId);

  const handleSnapshot = useCallback((snapshot: QuerySnapshot) => {
    const postList : RecruitPost[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt : doc.data().createdAt?.toDate() || new Date(),
      updatedAt : doc.data().updatedAt?.toDate() || new Date(),
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

    const postsRef = collection(db , 'recruitPosts');
    const q = query(
      postsRef,
      where('authorId' , '==' , userId),
      orderBy('createdAt' , 'desc')
    );

    const unsubscribe = onSnapshot(q, handleSnapshot, handleError);
    return () => unsubscribe();
  } , [userId, handleSnapshot, handleError])

  return {posts , isLoading};
}
