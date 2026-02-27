'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/hooks/useAuth';
import { useMessages, sendMessage } from '@/src/hooks/useMessage';
import ChatRoom from '@/src/components/ChatRoom';
import { ChatRoom as ChatRoomType } from '@/src/types';
import { leaveChatRoom } from '@/src/lib/chatService';

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const { user, isLoading: authLoading } = useAuth();
  const { messages, isLoading: messagesLoading } = useMessages(roomId);
  const [chatRoom, setChatRoom] = useState<ChatRoomType | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [isLeaving , setIsLeaving] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

  // 채팅방 정보 가져오기
  useEffect(() => {
    const fetchChatRoom = async () => {
      const roomDoc = await getDoc(doc(db, 'chatRooms', roomId));

      if (roomDoc.exists()) {
        const data = roomDoc.data();
        setChatRoom({
          id: roomDoc.id,
          participants: data.participants,
          participantNames: data.participantNames,
          participantName: data.participantName || '',
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
          unreadCount: data.unreadCount || 0, 
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      }
      setRoomLoading(false);
    };

    fetchChatRoom();
  }, [roomId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSendMessage = async (text: string) => {
    if (!user) return;

    await sendMessage(
      roomId,
      user.uid,
      user.displayName || '사용자',
      text
    );
  };

  // 채팅방 나가기
  const handleLeaveChatRoom = async () => {
    const confirmed = window.confirm('채팅방을 나가시겠습니까?\n대화 내용이 모두 삭제됩니다.');
    if(!confirmed) return;

    setIsLeaving(true);
    try{
      await leaveChatRoom(roomId);
      router.push('/chat');
    }catch(e){
      console.error('채팅방 나가기 실패' ,e);
      alert('채팅방 나가지 못했습니다.')
    }
    setIsLeaving(false);

  }

  if (authLoading || roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!user || !chatRoom) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">채팅방을 찾을 수 없습니다</p>
        <Link href="/chat" className="text-green-600">
          채팅 목록으로
        </Link>
      </div>
    );
  }

  // 상대방 정보
  const otherUserId = chatRoom.participants?.find((id) => id !== user.uid);
  const otherUserName = otherUserId
    ? chatRoom.participantNames[otherUserId] || '사용자'
    : '사용자';

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white border-b px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-gray-600 text-xl">
            ←
          </Link>
          <Link
            href={otherUserId ? `/users/${otherUserId}` : '#'}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm font-medium">
                {otherUserName.charAt(0)}
              </span>
            </div>
            <span className="font-medium">{otherUserName}</span>
          </Link>
        </div>

        {/* 메뉴 버튼 */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full"
          >
            ⋮
          </button>

          {/* 드롭다운 메뉴 */}
          {showMenu && (
            <>
              {/* 메뉴 외부 클릭 시 닫기 */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-10 bg-white border rounded-lg shadow-lg z-20 py-1 min-w-35">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleLeaveChatRoom();
                  }}
                  className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-50 text-sm"
                >
                   채팅방 나가기
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 채팅방 */}
      <div className="flex-1 overflow-hidden">
        <ChatRoom
          messages={messages}
          currentUserId={user.uid}
          onSendMessage={handleSendMessage}
          loading={messagesLoading}
        />
      </div>

      {/* 나가기 로딩 오버레이 */}
      {isLeaving && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg px-6 py-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
            <span>채팅방 나가는 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}