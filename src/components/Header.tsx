'use client';

import Link from 'next/link';
import { useAuth } from '@/src/hooks/useAuth';
import { useChatRooms } from '@/src/hooks/useChatRoom';

export default function Header() {
  const { user, isLoading } = useAuth();
  const { chatRooms } = useChatRooms(user?.uid);

  // 읽지 않은 채팅 표시 (lastMessage가 있는 방 수)
  const hasNewChat = chatRooms.length > 0;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-green-600">
          ⚽ ChatFutsal
        </Link>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          ) : user ? (
            <>
              {/* 채팅 아이콘 */}
              <Link href="/chat" className="relative">
                <span className="text-xl">💬</span>
                {hasNewChat && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
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