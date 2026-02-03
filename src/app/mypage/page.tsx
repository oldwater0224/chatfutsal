'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import Header from '@/src/components/Header';
import BottomNav from '@/src/components/BottomNav';
import { useMyMatches } from '@/src/hooks/useMyMatches';
import { useChatRooms } from '@/src/hooks/useChatRoom';

export default function MyPage() {
  const { user, userData, isLoading, logout } = useAuth();
  const router = useRouter();
  const {matches} = useMyMatches(user?.uid);
  const {chatRooms} = useChatRooms(user?.uid);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // 예정된 매치 수
  const today = new Date().toISOString().split('T')[0];
  const upcomingMatchCount = matches.filter((m) => m.date >= today).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-14 pb-16 px-4">
        {/* 프로필 카드 */}
        <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-2xl font-bold">
                {user.displayName?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.displayName || '사용자'}
              </h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">가입일</span>
              <span className="text-gray-900">
                {userData?.createdAt
                  ? new Date(userData.createdAt).toLocaleDateString()
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{upcomingMatchCount}</p>
            <p className="text-sm text-gray-500">예정된 매치</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{chatRooms.length}</p>
            <p className="text-sm text-gray-500">채팅방</p>
          </div>
        </div>

        {/* 메뉴 */}
        <div className="mt-4 space-y-2">
          <button
            onClick={() => router.push('/mypage/matches')}
            className="w-full bg-white p-4 rounded-lg text-left flex justify-between items-center shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span>⚽</span>
              <span>참가 신청한 매치</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={() => router.push('/chat')}
            className="w-full bg-white p-4 rounded-lg text-left flex justify-between items-center shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span>💬</span>
              <span>채팅 목록</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-white p-4 rounded-lg text-left text-red-500 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span>🚪</span>
              <span>로그아웃</span>
            </div>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
