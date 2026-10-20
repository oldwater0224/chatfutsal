"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, User } from "lucide-react";
import { useAppData } from "@/src/contexts/AppDataContext";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/chat", label: "채팅", icon: MessageCircle },
  { href: "/mypage", label: "MY", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { totalUnread } = useAppData();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100">
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
              className={`flex flex-col items-center justify-center gap-1 ${
                isActive ? "text-green-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div className="relative">
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 bg-red-500 rounded-full flex items-center justify-center px-1">
                    <span className="text-white text-[10px] font-bold">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  </span>
                )}
              </div>
              <span className={`text-[11px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
