"use client";

import ChatRoom from "@/src/components/ChatRoom";
import { useAuth } from "@/src/hooks/useAuth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const dummyMessages = [
  {
    id: "1",
    senderId: "other-user",
    senderName: "풋살러123",
    text: "안녕하세요! 내일 경기 참가하시나요?",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "2",
    senderId: "me",
    senderName: "나",
    text: "네! 참가합니다 ㅎㅎ",
    createdAt: new Date(Date.now() - 1000 * 60 * 25),
  },
  {
    id: "3",
    senderId: "other-user",
    senderName: "풋살러123",
    text: "좋아요~ 몇 시에 도착하실 예정이에요?",
    createdAt: new Date(Date.now() - 1000 * 60 * 20),
  },
];

export default function ChatRoomPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{roomId : string}>();
  const roomId = params.roomId as string;

  const [message, setMessage] = useState(dummyMessages);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleSendMessage = (text: string) => {
    const newMsg = {
      id: Date.now().toString(),
      senderId: 'me',
      senderName: user?.displayName || "나",
      text,
      createdAt: new Date(),
    };
    setMessage((prev) => [...prev, newMsg]);
    // TODO : Firestore에 메세지 저장
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



  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white border-b px-4 h-14 flex items-center gap-3">
        <Link href="/chat" className="text-gray-600">
          ← 
        </Link>
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 text-sm font-medium">풋</span>
        </div>
        <span className="font-medium">풋살러123</span>
      </header>

      {/* 채팅방 */}
      <div className="flex-1 overflow-hidden">
        <ChatRoom
          roomId={roomId}
          currentUserId= "me"
          message={message}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
