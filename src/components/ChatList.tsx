'use client';

import Link from 'next/link';
import { ChatRoom } from '@/src/types';

interface ChatRoomWithUnread extends ChatRoom {
  unreadCount: number;
}

interface ChatListProps {
  chatRooms: ChatRoomWithUnread[];
  currentUserId: string;
}

export default function ChatList({ chatRooms, currentUserId }: ChatListProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div>
      {chatRooms.map((room) => {
        const otherUserId = room.participants.find((id) => id !== currentUserId);
        const otherUserName = otherUserId
          ? room.participantNames[otherUserId] || '사용자'
          : '사용자';

        return (
          <Link key={room.id} href={`/chat/${room.id}`}>
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b">
              {/* 프로필 */}
              <div className="relative">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-medium text-lg">
                    {otherUserName.charAt(0)}
                  </span>
                </div>
                {/* 읽지 않은 메시지 배지 */}
                {room.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {room.unreadCount > 9 ? '9+' : room.unreadCount}
                    </span>
                  </div>
                )}
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${room.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {otherUserName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(room.lastMessageAt)}
                  </span>
                </div>
                <p className={`text-sm truncate ${room.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {room.lastMessage || '대화를 시작해보세요'}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}