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

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const { user, isLoading: authLoading } = useAuth();
  const { messages, isLoading: messagesLoading } = useMessages(roomId);
  const [chatRoom, setChatRoom] = useState<ChatRoomType | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);

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
      <header className="bg-white border-b px-4 h-14 flex items-center gap-3">
        <Link href="/chat" className="text-gray-600">
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
    </div>
  );
}