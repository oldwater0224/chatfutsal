"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-green-600">
          ChatFutsal
        </Link>

        {user ? (
          <Link
            href="/mypage"
            className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
          >
            <span className="text-green-600 text-sm font-medium">
              {user.displayName?.charAt(0) || "U"}
            </span>
          </Link>
        ) : (
          <Link href="/login" className="text-sm text-green-600 font-medium">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
