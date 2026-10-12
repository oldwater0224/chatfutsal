"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import Header from "@/src/components/Header";
import BottomNav from "@/src/components/BottomNav";
import {
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

const MENU_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/mypage/recruits", label: "내가 작성한 모집글", icon: FileText },
  { href: "/mypage/applications", label: "참가 신청 내역", icon: ClipboardList },
  { href: "/chat", label: "채팅 목록", icon: MessageCircle },
];

export default function MyPage() {
  const { user, userData, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;
    await logout();
    router.push("/");
  };

  if (!isLoading && !user) return null;

  const displayName = userData?.displayName || user?.displayName || "사용자";

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-14 pb-24">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="pt-3 pb-2 text-[22px] font-bold text-gray-900">MY</h1>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-7 h-7 border-[3px] border-green-100 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <section className="flex items-center gap-4 py-5">
                <div className="w-14 h-14 shrink-0 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl font-bold">{displayName.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900 truncate">{displayName}</p>
                  <p className="mt-0.5 text-[13px] text-gray-500 truncate">
                    {user?.email || "카카오 계정으로 로그인"}
                  </p>
                </div>
              </section>

              <div className="-mx-4 h-2 bg-gray-50" />

              <section className="pt-5">
                <h2 className="text-[13px] font-semibold text-gray-400">내 활동</h2>
                <ul className="mt-1">
                  {MENU_ITEMS.map(({ href, label, icon: Icon }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="-mx-4 px-4 py-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50/70 transition-colors"
                      >
                        <Icon className="w-5 h-5 text-gray-500" />
                        <span className="flex-1 text-[15px] text-gray-900">{label}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="pt-6">
                <h2 className="text-[13px] font-semibold text-gray-400">계정</h2>
                <button
                  onClick={handleLogout}
                  className="-mx-4 mt-1 px-4 py-4 flex items-center gap-3 text-left hover:bg-gray-50/70 transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5 text-red-500" />
                  <span className="text-[15px] text-red-500">로그아웃</span>
                </button>
              </section>
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
