'use client';

import Link from 'next/link';
import { useAuth } from '@/src/hooks/useAuth';
import { useChatRooms } from '@/src/hooks/useChatRoom';

import { MessageCircleIcon } from 'lucide-react';

export default function Header() {
  const { user, isLoading } = useAuth();
  const { totalUnread } = useChatRooms(user?.uid);
 

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white ">
      <div className=" mx-auto px-4 h-14 flex justify-around items-center ">
        {/* 로고 */}
        <Link href="/" className="text-xl font-bold text-green-600 ">
          ChatFutsal
        </Link>
        

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          ) : user ? (
            <>
              {/* 채팅 아이콘 */}
              <Link href="/chat" className="relative">
                <MessageCircleIcon className="w-5 h-5"></MessageCircleIcon>
                {totalUnread > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center px-1">
                    <span className="text-white text-xs font-bold">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  </span>
                )}
              </Link>

              {/* 프로필 */}
              <Link
                href="/mypage"
                className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200"
              >
                <span className="text-green-600 text-sm font-medium">
                  {user.displayName?.charAt(0) || 'U'}
                </span>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-full hover:bg-green-700"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}