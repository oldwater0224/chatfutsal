"use client";

import { useEffect, useState } from "react";
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
  ScrollText,
  ShieldCheck,
  UserPen,
  type LucideIcon,
} from "lucide-react";
import { avatarClass, focusRingInsetClass, spinnerClass } from "@/src/components/ui/styles";
import { getInitial } from "@/src/lib/utils/getInitial";

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
  off: "꺼짐",
  error: "설정 실패 · 다시 시도",
};

// 켜고 끌 수 있는 상태. 이때만 스위치로 보여 준다 (차단·미지원·확인 중·실패는 문구만)
const PUSH_SWITCH_STATUSES: PushStatus[] = ["default", "off", "enabled"];

// docs/features/푸시알림.md 3-2. 꺼짐·실패 상태에서는 켜고, 켜짐 상태에서는 끈다.
// 끄기는 다시 켜면 되므로 확인 창을 띄우지 않는다
function PushRow() {
  const { push } = useAppData();
  const isBusy = push.isEnabling || push.isDisabling;
  const isOn = push.status === "enabled";
  const isSwitch = PUSH_SWITCH_STATUSES.includes(push.status);
  const canToggle = (isSwitch || push.status === "error") && !isBusy;
  const label = push.isEnabling ? "켜는 중" : push.isDisabling ? "끄는 중" : PUSH_LABELS[push.status];

  const handleClick = () => {
    if (!canToggle) return;
    void (isOn ? push.disable() : push.enable());
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canToggle}
      role={isSwitch ? "switch" : undefined}
      aria-checked={isSwitch ? isOn : undefined}
      aria-busy={isBusy}
      aria-labelledby="push-row-title"
      aria-describedby="push-row-status"
      className={`-mx-4 w-[calc(100%+2rem)] px-4 py-4 flex items-center gap-3 border-b border-gray-100 text-left enabled:hover:bg-gray-50 enabled:cursor-pointer transition-colors ${focusRingInsetClass}`}
    >
      <Bell className="w-5 h-5 shrink-0 text-gray-500" aria-hidden="true" />
      <span id="push-row-title" className="flex-1 text-[15px] text-gray-900">
        푸시 알림
      </span>
      <span
        id="push-row-status"
        className={`text-right text-[13px] ${
          isOn && !isBusy ? "text-green-700 font-medium" : push.status === "error" && !isBusy ? "text-red-600" : "text-gray-500"
        }`}
      >
        {label}
      </span>
      {isSwitch && (
        // 꺼짐 상태도 흰 바탕과 3:1 이상 구분되도록 회색 500 테두리·손잡이를 쓴다
        <span
          aria-hidden="true"
          className={`relative inline-flex shrink-0 w-11 h-6 rounded-full border-2 transition-colors ${
            isOn ? "bg-green-600 border-green-600" : "bg-white border-gray-500"
          } ${isBusy ? "opacity-50" : ""}`}
        >
          <span
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-[left,background-color] ${
              isOn ? "left-[calc(100%-1.125rem)] bg-white" : "left-0.5 bg-gray-500"
            }`}
          />
        </span>
      )}
    </button>
  );
}

export default function MyPage() {
  const { user, userData, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 오프라인이면 푸시 토큰 정리를 최대 몇 초 기다리므로, 그동안 다시 누르지 못하게 막는다
  const handleLogout = async () => {
    if (isLoggingOut || !window.confirm("로그아웃할까요?")) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
    } catch {
      setIsLoggingOut(false);
    }
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
                  {getInitial(displayName)}
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
                <Link
                  href="/terms"
                  className={`-mx-4 px-4 py-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${focusRingInsetClass}`}
                >
                  <ScrollText className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  <span className="flex-1 text-[15px] text-gray-900">이용약관</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </Link>
                {/* 개인정보 처리방침은 다른 고지와 구분되게 굵게 표시한다 (법령상 요구) */}
                <Link
                  href="/privacy"
                  className={`-mx-4 px-4 py-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${focusRingInsetClass}`}
                >
                  <ShieldCheck className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  <span className="flex-1 text-[15px] font-semibold text-gray-900">개인정보 처리방침</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  aria-busy={isLoggingOut}
                  className={`-mx-4 w-[calc(100%+2rem)] px-4 py-4 flex items-center gap-3 text-left enabled:hover:bg-gray-50 enabled:cursor-pointer transition-colors ${focusRingInsetClass}`}
                >
                  <LogOut className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  <span className="text-[15px] text-gray-900">{isLoggingOut ? "로그아웃 중…" : "로그아웃"}</span>
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
