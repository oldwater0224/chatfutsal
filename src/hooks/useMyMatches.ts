'use client'

import { useEffect, useState } from "react"
import { Match } from "../types";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useMyMatches(userId : string | undefined){
  const [matches , setMatches] = useState<Match[]>([]);
  const [isLoading , setIsLoading] = useState(!!userId);
  const [error , setError] = useState<string | null>(null);

  useEffect(() => {
    if(!userId) return;
    const matchesRef = collection(db , 'matches');
    const q= query(
      matchesRef , 
      where('participants' , 'array-contains' , userId) , 
      orderBy('data' , 'desc')
    );

    const unsubscribe = onSnapshot(
      q, (snapshot) => {
        const matchList : Match[] = snapshot.docs.map((doc) => ({
          id: doc.id , 
          ...doc.data()
        })) as Match[];

        setMatches(matchList);
        setIsLoading(false);
      },
      (e) => {
        console.error('내 매치 불러오기 에러:' , e);
        setError('매치를 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();



  } , [userId]);


  return {matches , isLoading , error};
}
