'use client'

import { useEffect, useState } from "react"
import { RecruitPost } from "../types";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

// 전체 게시글 (모집 중)

export function useRecruitPosts(){
  const [posts , setPosts] = useState<RecruitPost[]>([]);
  const [isLoading , setIsLoading] = useState(true);;

  useEffect(() => {
    const postRef = collection(db , 'recruitPosts');
    const q = query(postRef , 
      where('status' , '==' , 'open') , 
      orderBy('createdAt' , 'desc')
    );


    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postList : RecruitPost[] =snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt : doc.data().createdAt?.toDate() || new Date(),
        updatedAt : doc.data().updatedAt?.toDate() || new Date(),
      })) as RecruitPost[];

      setPosts(postList);
      setIsLoading(false);
    });


    return () => unsubscribe();
  } , [])

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