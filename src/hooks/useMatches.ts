"use client";

import { useEffect, useState } from "react";
import { Match } from "../types";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

interface FilterState {
  date: string;
  region: string;
  level: string;
}

export function useMatches(filters?: FilterState) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const matchesRef = collection(db, "matches");
    // 기본 쿼리 : 날짜 순 정렬
    let q = query(matchesRef, orderBy("date", "asc"));

    //날짜에 대한 필터 적용
    if (filters?.date) {
      q = query(
        matchesRef,
        where("date", "==", filters.date),
        orderBy("time", "asc"),
      );
    }
     // 레벨 필터 적용 (날짜 필터 없을 때)
    if (filters?.level && !filters?.date) {
      q = query(
        matchesRef,
        where('level', '==', filters.level),
        orderBy('date', 'asc')
      );
    }
     // 날짜 + 레벨 동시 필터
    if (filters?.date && filters?.level) {
      q = query(
        matchesRef,
        where('date', '==', filters.date),
        where('level', '==', filters.level),
        orderBy('time', 'asc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let matchList: Match[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Match[];
         // 지역 필터는 클라이언트에서 처리 (location에 지역명 포함 여부)
      if (filters?.region) {
        matchList = matchList.filter((match) =>
          match.location.includes(filters.region)
        );
      }

      // 오늘 이후 매치만 표시 (날짜 필터 없을 때)
      if (!filters?.date) {
        const today = new Date().toISOString().split('T')[0];
        matchList = matchList.filter((match) => match.date >= today);
      }

        setMatches(matchList);
        setIsLoading(false);
      },
      (e) => {
        console.error("매치 불러오기 에러:", e);
        setError("매치 불러오기 실패");
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [filters?.date, filters?.region , filters?.level]);

  return { matches, isLoading, error };
}
