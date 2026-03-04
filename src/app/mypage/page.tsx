"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import { useMyMatches } from "@/src/hooks/useMyMatches";
import Header from "@/src/components/Header";
import BottomNav from "@/src/components/BottomNav";

export default function MyPage() {
  const { user, userData, isLoading, logout } = useAuth();
  const router = useRouter();
  const { matches } = useMyMatches(user?.uid);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    const confirmed = window.confirm("로그아웃 하시겠습니까?");
    if (!confirmed) return;

    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // 예정된 매치 수
  const today = new Date().toISOString().split("T")[0];
  const upcomingMatchCount = matches.filter((m) => m.date >= today).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-14 pb-20 px-4">
        {/* 프로필 카드 */}
        <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-2xl font-bold">
                {userData?.displayName?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {userData?.displayName || "사용자"}
              </h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Link
            href="/mypage/matches"
            className="bg-white rounded-lg p-4 shadow-sm text-center hover:bg-gray-50"
          >
            <p className="text-2xl font-bold text-green-600">
              {upcomingMatchCount}
            </p>
            <p className="text-sm text-gray-500">예정된 매치</p>
          </Link>
          <Link
            href="/chat"
            className="bg-white rounded-lg p-4 shadow-sm text-center hover:bg-gray-50"
          >
            <p className="text-2xl font-bold text-green-600">💬</p>
            <p className="text-sm text-gray-500">채팅</p>
          </Link>
        </div>

        {/* 메뉴 */}
        <div className="mt-6 space-y-2">
          <Link
            href="/mypage/matches"
            className="block w-full bg-white p-4 rounded-lg text-left shadow-sm hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span>⚽</span>
                <span>참가 신청한 매치</span>
              </div>
              <div className="flex items-center gap-2">
                {matches.length > 0 && (
                  <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">
                    {matches.length}
                  </span>
                )}
                <span className="text-gray-400">→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/chat"
            className="block w-full bg-white p-4 rounded-lg text-left shadow-sm hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span>💬</span>
                <span>채팅 목록</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Link>
          <Link
            href="/recruit/create"
            className="block w-full bg-white p-4 rounded-lg text-left shadow-sm hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span>📝</span>
                <span>용병 모집 글쓰기</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full bg-white p-4 rounded-lg text-left text-red-500 shadow-sm hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <span>🚪</span>
              <span>로그아웃</span>
            </div>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
