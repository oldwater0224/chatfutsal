"use client";

import { useEffect, useState } from "react";
import { Application } from "../types";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

// 특정 모집글의 신청 목록 (작성자용)
export function usePostApplications(postId: string | undefined) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(!!postId);

  useEffect(() => {
    if (!postId) {
      return;
    }

    const q = query(
      collection(db, "applications"),
      where("postId", "==", postId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Application[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Application[];

      setApplications(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  return { applications, isLoading };
}

// 내 신청 내역 (마이페이지용)
export function useMyApplications(userId: string | undefined) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const q = query(
      collection(db, "applications"),
      where("applicantId", "==", userId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Application[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Application[];

      setApplications(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { applications, isLoading };
}
