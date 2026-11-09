'use client';

import Link from 'next/link';
import { useAuth } from '@/src/hooks/useAuth';
import { useAppData } from '@/src/contexts/AppDataContext';

import { MessageCircle, Bell, Plus } from 'lucide-react';
import Logo from './Logo';
import {
  avatarClass,
  focusRingClass,
  iconButtonClass,
  primaryButtonClass,
  unreadBadgeClass,
} from './ui/styles';

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className={`absolute top-1 right-1 ${unreadBadgeClass}`} aria-hidden="true">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function unreadLabel(base: string, count: number) {
  return count > 0 ? `${base}, 읽지 않음 ${count}개` : base;
}

export default function Header() {
  const { user, isLoading } = useAuth();
  const { totalUnread, notificationUnread } = useAppData();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto h-14 px-4 flex items-center justify-between">
        <Logo />

        <nav aria-label="주요 메뉴" className="flex items-center gap-1">
          {isLoading ? (
            <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
          ) : user ? (
            <>
              {/* 모바일은 홈 화면의 플로팅 버튼을 쓴다 */}
              <Link
                href="/create"
                className={`${primaryButtonClass} max-md:hidden mr-2 h-9 pl-3 pr-4 text-[13px]`}
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                모집하기
              </Link>
              <Link
                href="/notifications"
                aria-label={unreadLabel('알림', notificationUnread)}
                className={`relative ${iconButtonClass}`}
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                <UnreadBadge count={notificationUnread} />
              </Link>

              <Link
                href="/chat"
                aria-label={unreadLabel('채팅', totalUnread)}
                className={`relative ${iconButtonClass}`}
              >
                <MessageCircle className="w-5 h-5" aria-hidden="true" />
                <UnreadBadge count={totalUnread} />
              </Link>

              <Link
                href="/mypage"
                aria-label="마이페이지"
                className={`ml-1 w-8 h-8 text-[13px] hover:bg-gray-200 transition-colors ${avatarClass} ${focusRingClass}`}
              >
                {user.displayName?.charAt(0) || 'U'}
              </Link>
            </>
          ) : (
            <Link href="/login" className={`${primaryButtonClass} h-9 px-4 text-[13px]`}>
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
