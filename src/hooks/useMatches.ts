"use client";

import { useEffect, useState } from "react";
import { Match } from "../types";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

export function useMatches(filters?: { date?: string; region?: string }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const matchesRef = collection(db, "matches");
    let q = query(matchesRef, orderBy("date", "asc"));

    //날짜에 대한 필터 적용
    if (filters?.date) {
      q = query(
        matchesRef,
        where("date", "==", filters.date),
        orderBy("time", "asc"),
      );
    }
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matchList: Match[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Match[];

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
  }, [filters?.date, filters?.region]);

  return { matches, isLoading, error };
}
