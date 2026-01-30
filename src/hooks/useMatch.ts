// 단일매치 불러오기

'use client'

import { useEffect, useState } from "react";
import { Match } from "../types";
import { doc , onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";


export function useMatch(matchId: string){
  // matchId 가 없다면 처음부터 로딩 false
  const [match , setMatch] = useState<Match | null>(null);
  const [isLoading , setIsLoading] = useState(!!matchId); // matchId 있을때만 true
  const [error , setError] = useState<string | null>(null);


  useEffect(() => {
    if(!matchId){
      //setState 없이 그냥 return
      return;
    }
    

    const matchRef = doc(db , 'matches' , matchId);

    const unsubscribe = onSnapshot(
      matchRef , (snapshot) => {
        if(snapshot.exists()){
          setMatch({
            id: snapshot.id , 
            ...snapshot.data() , 
          } as Match);
        }else {
          setError('매치를 찾을 수 없습니다.');
        }
        setIsLoading(false);
      },
      (e) => {
        console.error('매치 불러오기 에러:' , e);
        setError('매치를 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    );
      
    return () => unsubscribe();
  } , [matchId]);

  return {match , isLoading , error}
}