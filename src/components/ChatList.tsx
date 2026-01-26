"use client";

import Link from "next/link";

interface ChatRoom {
  id: string;
  participantName: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

interface ChatListProps {
  chatRooms: ChatRoom[];
}

export default function ChatList({ chatRooms }: ChatListProps) {
  if (chatRooms.length === 0) {
    return (
      <div>
        <span className="text-4xl mb-4">💬</span>
        <p>아직 채팅이 없어요..</p>
        <p className="text-sm">매치 참가자와 대화를 시작해보세요</p>
      </div>
    );
  }

  return <div>
    {chatRooms.map((room) => (
      <Link key={room.id} href={`/chat/${room.id}`}>
        <div className="flex items-center gap-3 p-4 bg-white border-b hover:bg-gray-50">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-medium">
              {room.participantName.charAt(0)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-gray-900">
                {room.participantName}
              </span>
              <span className="text-xs text-gray-400">
                {formatTime(room.lastMessageAt)}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">{room.lastMessage}</p>
          </div>

          {room.unreadCount > 0 && (
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">{room.unreadCount}</span>
            </div>
          )}
        </div>
      </Link>
    ))}
  </div>;
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString();
}
