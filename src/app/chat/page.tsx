"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { useChatRooms } from "@/src/hooks/useChatRoom";
import BottomNav from "@/src/components/BottomNav";
import UserSearchModal from "@/src/components/UserSearchModal";

export default function ChatListPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { chatRooms, isLoading: roomsLoading } = useChatRooms(user?.uid);

  // 로그인 체크
  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  if (authLoading || roomsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className=" mx-auto px-4 h-14 flex items-center">
          <h1 className="text-lg font-bold">채팅</h1>
        </div>
      </header>

      {/* 채팅 목록 */}
      <main className="pt-14 px-4">
        {chatRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-4xl mb-4">💬</p>
            <p>아직 채팅이 없습니다</p>
            <p className="text-sm mt-1">매치에 참가하거나 용병을 구해보세요!</p>
          </div>
        ) : (
          <div className="space-y-2 mt-4">
            {chatRooms.map((room) => {
              const otherUserId = room.participants?.find(
                (id) => id !== user?.uid,
              );
              const otherUserName = otherUserId
                ? room.participantNames?.[otherUserId] || "사용자"
                : "사용자";

              return (
                <Link
                  key={room.id}
                  href={`/chat/${room.id}`}
                  className="block bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* 프로필 아바타 */}
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-green-600 font-medium">
                        {otherUserName.charAt(0)}
                      </span>
                    </div>

                    {/* 채팅 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">
                          {otherUserName}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {room.lastMessageAt?.toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500 truncate">
                          {room.lastMessage || "새로운 채팅 "}
                        </p>
                        {room.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full shrink-0">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
