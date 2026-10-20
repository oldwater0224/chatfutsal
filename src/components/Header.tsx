'use client';

import Link from 'next/link';
import { useAuth } from '@/src/hooks/useAuth';
import { useAppData } from '@/src/contexts/AppDataContext';

import { MessageCircleIcon, Bell } from 'lucide-react';
import Logo from './Logo';

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function Header() {
  const { user, isLoading } = useAuth();
  const { totalUnread, notificationUnread } = useAppData();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Logo />

        <nav className="flex items-center gap-0.5 sm:gap-1 text-gray-700">
          {isLoading ? (
            <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/notifications"
                aria-label="알림"
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <Bell className="w-[22px] h-[22px]" />
                <UnreadBadge count={notificationUnread} />
              </Link>

              <Link
                href="/chat"
                aria-label="채팅"
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <MessageCircleIcon className="w-[22px] h-[22px]" />
                <UnreadBadge count={totalUnread} />
              </Link>

              <Link
                href="/mypage"
                aria-label="마이페이지"
                className="ml-1 sm:ml-2 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200"
              >
                <span className="text-green-600 text-sm font-semibold">
                  {user.displayName?.charAt(0) || 'U'}
                </span>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="h-9 px-4 inline-flex items-center rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
