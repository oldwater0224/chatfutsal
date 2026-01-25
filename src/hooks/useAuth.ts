"use client";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
}
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("1. useAuth 시작");
    console.log("1-1. db 객체:", db);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("2. onAuthStateChanged 콜백 실행 , user:", currentUser);
      setUser(currentUser);

      if (currentUser) {
        //Firestore 에서 유저 추가 정보 가져오기
        try {
          console.log("2-1 . firestore 조회시작 , uid:", currentUser.uid);
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
          console.log("3. firestore 조회 완료 , exists:", userDoc.exists());
        } catch (e) {
          console.error("firestore 에러:", e);
          // ✅ 에러 시 Auth 정보로 기본 userData 생성
          setUserData({
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || "사용자",
            createdAt: new Date(),
          });
          // setUserData(null);
        } finally {
          setIsLoading(false);
        }

        console.log("3. firestore 조회완료");
      } else {
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  return { user, userData, isLoading, logout };
}
