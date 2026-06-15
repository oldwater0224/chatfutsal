'use client'

import { useEffect, useState } from "react"
import { RecruitPost } from "../types";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

interface RecruitFilters {
  date: string;
  region: string;
  level: string;
}

export function useRecruitPosts(filters?: RecruitFilters){
  const [posts , setPosts] = useState<RecruitPost[]>([]);
  const [isLoading , setIsLoading] = useState(true);

  useEffect(() => {
    const postRef = collection(db , 'recruitPosts');
    const q = query(postRef ,
      where('status' , '==' , 'open') ,
      orderBy('createdAt' , 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

      setPosts(postList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  } , [filters?.date, filters?.region, filters?.level])

  return {posts , isLoading};
}


// 내가 작성한 게시글
export function useMyRecruitPosts(userId : string | undefined){
  const [posts , setPosts] = useState<RecruitPost[]>([]);
  const [isLoading , setIsLoading] = useState(false);

  useEffect(() => {
    if(!userId) {
      
      return;
    }
    const postsRef = collection(db , 'recruitPosts');
    const q= query(
      postsRef,
      where('authorId' , '==' , userId),
      orderBy('createdAt' , 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot)=> {
      const postList : RecruitPost[] = snapshot.docs.map((doc)=> ({
        id: doc.id,
        ...doc.data(),
        createdAt : doc.data().createdAt?.toDate || new Date(),
        updatedAt : doc.data().updatedAt?.toDate || new Date(),
      })) as RecruitPost[];
      

      setPosts(postList);
      setIsLoading(false);
    });

    return () => unsubscribe();

  } , [userId])

  return {posts , isLoading};
}