'use client'


import BottomNav from "@/src/components/BottomNav";
import ChatList from "@/src/components/ChatList";
import Header from "@/src/components/Header";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const dummyChatRooms = [
  {
    id: "room1",
    participantName: "풋살러123",
    lastMessage: "내일 경기 몇 시에 시작해요?",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5), // 5분 전
    unreadCount: 2,
  },
  {
    id: "room2",
    participantName: "메시좋아",
    lastMessage: "좋은 경기였습니다!",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3시간 전
    unreadCount: 0,
  },
  {
    id: "room3",
    participantName: "주말풋살러",
    lastMessage: "다음에 또 같이 해요",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
    unreadCount: 0,
  },
];

export default function ChatPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩중...</p>
      </div>
    );
  }

  if(!user) return null;


  return (
    <>
      <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-14 pb-16">
        <div className="bg-white border-b px-4 py-3">
          <h1 className="text-lg font-bold">채팅</h1>
        </div>

        <ChatList chatRooms={dummyChatRooms} />
      </main>

      <BottomNav />
    </div>
    </>
  );
}
