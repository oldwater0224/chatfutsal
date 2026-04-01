<<<<<<< HEAD
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useChatRooms } from '@/src/hooks/useChatRoom';
=======
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useChatRooms } from "@/src/hooks/useChatRoom";
import { useState } from "react";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/recruit", label: "용병", icon: FileText },
  { href: "/chat", label: "채팅", icon: MessageCircle },
  { href: "/mypage", label: "MY", icon: User },
];
>>>>>>> ffc5b7a1662e590ccb683fb96f33a18bf9771d53

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { totalUnread } = useChatRooms(user?.uid);
<<<<<<< HEAD

  const navItems = [
    { href: '/', label: '홈', icon: '⚽' },
    { href: '/recruit', label: '용병', icon: '📝' },
    { href: '/chat', label: '채팅', icon: '💬', badge: totalUnread },
    { href: '/mypage', label: 'MY', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

=======
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-gray-100 z-50">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item, index) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const isPressed = pressedIndex === index;
          const Icon = item.icon;
          const badge = item.href === "/chat" ? totalUnread : 0;

>>>>>>> ffc5b7a1662e590ccb683fb96f33a18bf9771d53
          return (
            <Link
              key={item.href}
              href={item.href}
<<<<<<< HEAD
              className={`flex flex-col items-center gap-1 min-w-16 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-green-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <span className="text-xl">{item.icon}</span>
                {/* 배지 */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-3 min-w-4 h-4 bg-red-500 rounded-full flex items-center justify-center px-1">
                    <span className="text-white text-[10px] font-bold">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  </span>
                )}
              </div>
              <span className={`text-xs ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
=======
              className="relative flex flex-col items-center gap-1 min-w-[64px] py-1"
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
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center px-1 animate-pulse">
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
>>>>>>> ffc5b7a1662e590ccb683fb96f33a18bf9771d53
            </Link>
          );
        })}
      </div>
    </nav>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> ffc5b7a1662e590ccb683fb96f33a18bf9771d53
