"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useChatRooms } from "@/src/hooks/useChatRoom";
import { useState } from "react";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/chat", label: "채팅", icon: MessageCircle },
  { href: "/mypage", label: "MY", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { totalUnread } = useChatRooms(user?.uid);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-gray-100 z-50">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between md:justify-around lg:justify-evenly">
        {navItems.map((item, index) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const isPressed = pressedIndex === index;
          const Icon = item.icon;
          const badge = item.href === "/chat" ? totalUnread : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 min-w-16 py-1"
            >
              {/* 아이콘 컨테이너 */}
              <div
                className={`relative p-2 rounded-2xl transition-all duration-300`}
              >
                <Icon
                  className={`w-5 h-5 transition-all duration-300`}
                />

                {/* 배지 */}
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-red-500 rounded-full flex items-center justify-center px-1 animate-pulse">
                    <span className="text-white text-[10px] font-bold">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  </span>
                )}

                {/* 활성 상태 물결 효과 */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping opacity-75" />
                )}
              </div>

              {/* 라벨 */}
              <span
                className={`text-xs font-medium transition-all duration-300 ${
                  isActive ? "text-emerald-600" : "text-gray-400"
                } ${isPressed ? "scale-90" : "scale-100"}`}
              >
                {item.label}
              </span>

              {/* 활성 인디케이터 점 */}
              <div
                className={`absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-500 transition-all duration-300 ${
                  isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
