"use client";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
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

  const handleAuthChange = useCallback(async (currentUser: User | null) => {
    setUser(currentUser);

    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } catch (e) {
        console.error("firestore 에러:", e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setUserData(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthChange);
    return () => unsubscribe();
  }, [handleAuthChange]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  return { user, userData, isLoading, logout };
}
