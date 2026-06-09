"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import Header from "@/src/components/Header";
import BottomNav from "@/src/components/BottomNav";
import { FileTextIcon, LogOut, MessageCircleIcon } from "lucide-react";

export default function MyPage() {
  const { user, userData, isLoading, logout } = useAuth();
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-14 pb-20 px-4  max-w-5xl mx-auto">
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

        {/* 메뉴 */}
        <div className="mt-6 space-y-2">
          <Link
            href="/chat"
            className="block w-full bg-white p-4 rounded-lg text-left shadow-sm hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <MessageCircleIcon className="w-5 h-5" />
                <span>채팅 목록</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Link>
          <Link
            href="/mypage/recruits"
            className="block w-full bg-white p-4 rounded-lg text-left shadow-sm hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileTextIcon className="w-5 h-5" />
                <span>내가 작성한 용병모집 게시글</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full bg-white p-4 rounded-lg text-left shadow-sm hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5"/>
              <span className="text-red-500">로그아웃</span>
            </div>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
