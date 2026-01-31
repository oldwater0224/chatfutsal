'use client'


import BottomNav from "@/src/components/BottomNav";
import ChatList from "@/src/components/ChatList";
import Header from "@/src/components/Header";
import { useAuth } from "@/src/hooks/useAuth";
import { useChatRooms } from "@/src/hooks/useChatRoom";
import { useRouter } from "next/navigation";
import { useEffect } from "react";



export default function ChatPage() {
  const { user, isLoading : authLoading } = useAuth();
  const router = useRouter();
  const {chatRooms , isLoading : roomsLoading , error} = useChatRooms(user?.uid);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || roomsLoading) {
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

        {error ? (
          <div className="flex justify-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <ChatList chatRooms={chatRooms} currentUserId={user.uid} />
        )}
      </main>

      <BottomNav />
    </div>
    </>
  );
}
