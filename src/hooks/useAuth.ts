"use client";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, DocumentSnapshot, FirestoreError, onSnapshot } from "firebase/firestore";
import { unregisterPushToken } from "../lib/services/pushService";

// users 문서 (src/types의 User와 같은 필드). 이메일은 저장하지 않으므로 user.email을 쓴다
interface UserData {
  uid: string;
  displayName: string;
  provider?: "email" | "kakao";
  createdAt: Date;
}

// 어느 uid의 users 문서를 받았는지 함께 둔다. 계정이 바뀐 직후 이전 계정의 문서를 보여 주지 않기 위해서다
interface UserDocState {
  uid: string;
  data: UserData | null;
}

// 헤더와 페이지가 각각 useAuth를 쓰므로 users 문서 구독도 인스턴스마다 생긴다.
// 로그아웃할 때 모두 먼저 끊어, 로그아웃 뒤 남은 구독이 permission-denied를 받지 않게 한다.
const userDocListeners = new Set<() => void>();

function stopAllUserDocListeners() {
  for (const stop of Array.from(userDocListeners)) stop();
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userDoc, setUserDoc] = useState<UserDocState | null>(null);

  const handleAuthChange = useCallback((currentUser: User | null) => {
    setUser(currentUser);
    setAuthReady(true);
    if (!currentUser) setUserDoc(null);
  }, []);

  // 문서가 아직 없으면(카카오 첫 로그인 직후 등) data는 null이고, 문서가 만들어지면 다시 호출된다.
  // 닉네임 변경도 이 구독으로 바로 반영된다
  const handleUserDocSnapshot = useCallback((snap: DocumentSnapshot) => {
    setUserDoc({
      uid: snap.id,
      // 방금 쓴 serverTimestamp는 서버 확정 전까지 null이므로 추정값을 쓴다
      data: snap.exists()
        ? (snap.data({ serverTimestamps: "estimate" }) as UserData)
        : null,
    });
  }, []);

  const handleUserDocError = useCallback((uid: string, error: FirestoreError) => {
    // 로그아웃 중에 끊기기 전 도착한 거부는 정상 흐름이다
    if (!(error.code === "permission-denied" && !auth.currentUser)) {
      console.error("firestore 에러:", error);
    }
    setUserDoc({ uid, data: null });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthChange);
    return () => unsubscribe();
  }, [handleAuthChange]);

  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      handleUserDocSnapshot,
      (error) => handleUserDocError(uid, error),
    );
    const stop = () => {
      unsubscribe();
      userDocListeners.delete(stop);
    };
    userDocListeners.add(stop);
    return stop;
  }, [uid, handleUserDocSnapshot, handleUserDocError]);

  const logout = async () => {
    // 로그아웃 후에는 토큰 문서를 지울 권한이 없으므로 먼저 지운다
    if (auth.currentUser) await unregisterPushToken();
    stopAllUserDocListeners();
    await signOut(auth);
    setUser(null);
    setUserDoc(null);
  };

  // 현재 로그인한 uid의 문서만 내보낸다
  const userData = user && userDoc?.uid === user.uid ? userDoc.data : null;
  // 인증 상태를 아직 모르거나, 로그인했는데 그 사용자의 문서를 아직 한 번도 받지 못했으면 로딩 중
  const isLoading = !authReady || (user !== null && userDoc?.uid !== user.uid);

  return { user, userData, isLoading, logout };
}
