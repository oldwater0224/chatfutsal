"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, User } from "lucide-react";
import { useAppData } from "@/src/contexts/AppDataContext";
import { focusRingInsetClass, unreadBadgeClass } from "./ui/styles";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/chat", label: "채팅", icon: MessageCircle },
  { href: "/mypage", label: "MY", icon: User },
];

// 데스크톱(md 이상)은 상단 헤더의 로고·알림·채팅·마이 링크를 쓰므로 숨긴다
export default function BottomNav() {
  const pathname = usePathname();
  const { totalUnread } = useAppData();

  return (
    <nav
      aria-label="하단 메뉴"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
    >
      <div className="max-w-2xl mx-auto h-16 grid grid-cols-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const badge = item.href === "/chat" ? totalUnread : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${focusRingInsetClass} ${
                isActive ? "text-green-600" : "text-gray-500 hover:text-gray-600"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" aria-hidden="true" />
                {badge > 0 && (
                  <span className={`absolute -top-2 -right-2 ${unreadBadgeClass}`}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-xs ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
