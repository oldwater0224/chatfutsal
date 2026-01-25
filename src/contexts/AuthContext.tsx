"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc,  getDocFromServer } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider 시작 (1번만 실행되어야 함)");

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDoc = await getDocFromServer(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          } else {
            // 문서 없으면 기본값
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "사용자",
              createdAt: new Date(),
            });
          }
        } catch (e) {
          console.error("Firestore 에러:", e);
          setUserData({
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || "사용자",
            createdAt: new Date(),
          });
        }
      } else {
        setUserData(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
