'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useChatRooms } from '@/src/hooks/useChatRoom';
import { startChat } from '@/src/lib/chatService';
import Header from '@/src/components/Header';
import BottomNav from '@/src/components/BottomNav';
import ChatList from '@/src/components/ChatList';
import UserSearchModal from '@/src/components/UserSearchModal';


export default function ChatPage() {
  const { user, userData, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { chatRooms, isLoading: roomsLoading } = useChatRooms(user?.uid);
  const [isModalOpen , setIsModalOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  // 유저 선택 시 채팅 시작
  const handleSelectUser = async (selectedUser: {
    uid: string;
    displayName: string;
    email: string;
  }) => {
    if (!user || !userData || isStartingChat){
      console.log("조건 불충족으로 종료");
      return;
    }

    setIsStartingChat(true);
    try {
      const roomId = await startChat(
        { uid: user.uid, displayName: userData.displayName || '사용자' },
        { uid: selectedUser.uid, displayName: selectedUser.displayName }
      );

      setIsModalOpen(false);
      router.push(`/chat/${roomId}`);
    } catch (e) {
      console.error('채팅 시작 실패:', e);
      alert('채팅을 시작할 수 없습니다. 다시 시도해주세요.');
    }
    setIsStartingChat(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-14 pb-20">
        {/* 페이지 헤더 */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">채팅</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition-colors"
          >
            <span>+</span>
            <span>새 채팅</span>
          </button>
        </div>

        {/* 채팅 목록 */}
        {roomsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : chatRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-5xl mb-4">💬</span>
            <p className="text-gray-700 font-medium mb-1">채팅이 없어요</p>
            <p className="text-gray-500 text-sm mb-4">새로운 대화를 시작해보세요!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              새 채팅 시작하기
            </button>
          </div>
        ) : (
          <ChatList chatRooms={chatRooms} currentUserId={user.uid} />
        )}
      </main>

      <BottomNav />

      {/* 유저 검색 모달 */}
      <UserSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectUser={handleSelectUser}
        currentUserId={user.uid}
      />

      {/* 채팅 시작 로딩  */}
      {isStartingChat && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg px-6 py-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
            <span>채팅방 생성 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}