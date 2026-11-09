"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import { useAppData } from "@/src/contexts/AppDataContext";
import type { PushStatus } from "@/src/hooks/usePushNotifications";
import Header from "@/src/components/Header";
import BottomNav from "@/src/components/BottomNav";
import {
  Bell,
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  MessageCircle,
  UserPen,
  type LucideIcon,
} from "lucide-react";
import { avatarClass, focusRingInsetClass, spinnerClass } from "@/src/components/ui/styles";

const MENU_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/mypage/recruits", label: "내가 작성한 모집글", icon: FileText },
  { href: "/mypage/applications", label: "참가 신청 내역", icon: ClipboardList },
  { href: "/chat", label: "채팅 목록", icon: MessageCircle },
];

const PUSH_LABELS: Record<PushStatus, string> = {
  checking: "",
  unsupported: "이 브라우저는 지원하지 않아요",
  default: "꺼짐",
  denied: "차단됨 · 브라우저 설정에서 허용",
  enabled: "켜짐",
  error: "설정 실패 · 다시 시도",
};

// docs/features/푸시알림.md 3-2. 꺼짐·실패 상태에서만 눌러서 켤 수 있다
function PushRow() {
  const { push } = useAppData();
  const canEnable = (push.status === "default" || push.status === "error") && !push.isEnabling;

  return (
    <button
      type="button"
      onClick={push.enable}
      disabled={!canEnable}
      className={`-mx-4 w-[calc(100%+2rem)] px-4 py-4 flex items-center gap-3 border-b border-gray-100 text-left enabled:hover:bg-gray-50 enabled:cursor-pointer transition-colors ${focusRingInsetClass}`}
    >
      <Bell className="w-5 h-5 text-gray-500" aria-hidden="true" />
      <span className="flex-1 text-[15px] text-gray-900">푸시 알림</span>
      <span
        className={`text-[13px] ${
          push.status === "enabled" ? "text-green-700 font-medium" : push.status === "error" ? "text-red-600" : "text-gray-500"
        }`}
      >
        {push.isEnabling ? "켜는 중" : PUSH_LABELS[push.status]}
      </span>
    </button>
  );
}

export default function MyPage() {
  const { user, userData, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    if (!window.confirm("로그아웃할까요?")) return;
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
          <h1 className="pt-4 pb-2 text-[22px] font-semibold text-gray-900">MY</h1>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className={spinnerClass} role="status" aria-label="불러오는 중" />
            </div>
          ) : (
            <>
              <section className="flex items-center gap-4 py-5">
                <div className={`w-14 h-14 text-[22px] ${avatarClass}`} aria-hidden="true">
                  {displayName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold text-gray-900 truncate">{displayName}</p>
                  <p className="mt-1 text-[13px] text-gray-600 truncate">
                    {user?.email || "카카오 계정으로 로그인"}
                  </p>
                </div>
              </section>

              <div className="-mx-4 h-2 bg-gray-50" />

              <section className="pt-5">
                <h2 className="text-[13px] font-medium text-gray-500">내 활동</h2>
                <ul className="mt-2">
                  {MENU_ITEMS.map(({ href, label, icon: Icon }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`-mx-4 px-4 py-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${focusRingInsetClass}`}
                      >
                        <Icon className="w-5 h-5 text-gray-500" aria-hidden="true" />
                        <span className="flex-1 text-[15px] text-gray-900">{label}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="pt-6">
                <h2 className="text-[13px] font-medium text-gray-500">계정</h2>
                <Link
                  href="/mypage/profile"
                  className={`-mx-4 mt-2 px-4 py-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${focusRingInsetClass}`}
                >
                  <UserPen className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  <span className="flex-1 text-[15px] text-gray-900">프로필 수정</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </Link>
                <PushRow />
                <button
                  onClick={handleLogout}
                  className={`-mx-4 w-[calc(100%+2rem)] px-4 py-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors cursor-pointer ${focusRingInsetClass}`}
                >
                  <LogOut className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  <span className="text-[15px] text-gray-900">로그아웃</span>
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
