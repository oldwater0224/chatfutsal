"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useAppData } from "@/src/contexts/AppDataContext";
import BottomNav from "@/src/components/BottomNav";
import Header from "@/src/components/Header";

function formatChatTime(date?: Date) {
  if (!date) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "어제";
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function ChatListPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { chatRooms, chatRoomsLoading: roomsLoading } = useAppData();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  if (!authLoading && !user) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-14 pb-24">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="pt-3 pb-2 text-[22px] font-bold text-gray-900">채팅</h1>

          {authLoading || roomsLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-7 h-7 border-[3px] border-green-100 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="flex flex-col items-center text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                <MessageCircle className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-[15px] font-semibold text-gray-900">아직 채팅이 없어요</p>
              <p className="mt-1 text-sm text-gray-500">
                모집글에 참가 신청하면 작성자와 대화할 수 있어요
              </p>
              <Link
                href="/"
                className="mt-5 h-10 px-5 inline-flex items-center rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
              >
                모집글 둘러보기
              </Link>
            </div>
          ) : (
            <ul>
              {chatRooms.map((room) => {
                const otherUserId = room.participants?.find((id) => id !== user?.uid);
                const otherUserName = otherUserId
                  ? room.participantNames?.[otherUserId] || "사용자"
                  : "사용자";
                const hasUnread = room.unreadCount > 0;

                return (
                  <li key={room.id}>
                    <Link
                      href={`/chat/${room.id}`}
                      className="-mx-4 px-4 py-3.5 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50/70 transition-colors"
                    >
                      <div className="w-12 h-12 shrink-0 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-base font-semibold">
                          {otherUserName.charAt(0)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[15px] font-semibold text-gray-900 truncate">
                            {otherUserName}
                          </span>
                          <span className="shrink-0 text-xs text-gray-400">
                            {formatChatTime(room.lastMessageAt)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p
                            className={`text-[13px] truncate ${
                              hasUnread ? "text-gray-800 font-medium" : "text-gray-500"
                            }`}
                          >
                            {room.lastMessage || "새로운 채팅방이 열렸어요"}
                          </p>
                          {hasUnread && (
                            <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-green-600 text-white text-[11px] font-bold flex items-center justify-center">
                              {room.unreadCount > 99 ? "99+" : room.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
