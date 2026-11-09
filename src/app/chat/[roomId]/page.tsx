"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, DocumentSnapshot, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/hooks/useAuth";
import { useMessages, sendMessage } from "@/src/hooks/useMessage";
import {
  leaveChatRoom,
  markMessagesAsRead,
  parseLeftAt,
} from "@/src/lib/services";
import ChatRoom from "@/src/components/ChatRoom";
import { ChatRoom as ChatRoomType } from "@/src/types";
import { LogOut, MoreVertical } from "lucide-react";
import SubHeader from "@/src/components/SubHeader";
import {
  avatarClass,
  dangerMenuItemClass,
  focusRingClass,
  iconButtonClass,
  primaryButtonClass,
  spinnerClass,
} from "@/src/components/ui/styles";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const { user, isLoading: authLoading } = useAuth();
  const {
    messages: allMessages,
    isLoading: messagesLoading,
    hasMore: hasMoreMessages,
    loadMore: loadMoreMessages,
  } = useMessages(roomId, user?.uid);
  const [chatRoom, setChatRoom] = useState<ChatRoomType | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // 읽음 처리 함수
  const handleMarkAsRead = useCallback(async () => {
    if (user && roomId) {
      await markMessagesAsRead(roomId, user.uid);
    }
  }, [user, roomId]);

  // 채팅방 정보 구독: 대화 중에 상대가 닉네임을 바꿔도 바로 반영된다
  const handleRoomSnapshot = useCallback((roomDoc: DocumentSnapshot) => {
    if (roomDoc.exists()) {
      const data = roomDoc.data();
      setChatRoom({
        id: roomDoc.id,
        participants: data.participants,
        participantNames: data.participantNames,
        participantName: "",
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
        unreadCount: 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        leftAt: parseLeftAt(data.leftAt),
      });
    } else {
      setChatRoom(null);
    }
    setRoomLoading(false);
  }, []);

  // 구독이 끊겨도 마지막으로 받은 채팅방 정보는 그대로 둔다
  const handleRoomError = useCallback((error: Error) => {
    console.error("채팅방 불러오기 실패:", error);
    setRoomLoading(false);
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    return onSnapshot(doc(db, "chatRooms", roomId), handleRoomSnapshot, handleRoomError);
  }, [roomId, user, handleRoomSnapshot, handleRoomError]);

  // 내가 나간 적이 있으면 나간 이후 메시지만 표시
  const myLeftAt = user ? chatRoom?.leftAt?.[user.uid] : undefined;
  const messages = useMemo(() => {
    if (!myLeftAt) return allMessages;
    return allMessages.filter(
      (msg) => msg.createdAt.getTime() > myLeftAt.getTime(),
    );
  }, [allMessages, myLeftAt]);
  // 나가기 전 메시지는 보이지 않으므로, 이미 그 시점까지 불러왔다면 더 불러올 것이 없다
  const canLoadOlder =
    hasMoreMessages &&
    !(myLeftAt && allMessages[0] && allMessages[0].createdAt.getTime() <= myLeftAt.getTime());

  // 채팅방 입장 시 읽음 처리
  useEffect(() => {
    if (!authLoading && !messagesLoading && user && messages.length > 0) {
      handleMarkAsRead();
    }
  }, [authLoading, messagesLoading, user, messages.length, handleMarkAsRead]);

  // 새 메시지 수신 시 읽음 처리
  useEffect(() => {
    if (!user || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // 상대방이 보낸 새 메시지가 있으면 읽음 처리
    if (lastMessage.senderId !== user.uid) {
      const readBy = lastMessage.readBy || [];
      if (!readBy.includes(user.uid)) {
        handleMarkAsRead();
      }
    }
  }, [messages, user, handleMarkAsRead]);

  // 페이지 포커스 시 읽음 처리 (탭 전환 후 돌아왔을 때)
  useEffect(() => {
    const handleFocus = () => {
      if (user && roomId) {
        handleMarkAsRead();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, roomId, handleMarkAsRead]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleSendMessage = async (text: string) => {
    if (!user) return;

    await sendMessage(roomId, user.uid, user.displayName || "사용자", text);
  };

  const handleLeaveChatRoom = async () => {
    const confirmed = window.confirm(
      "채팅방을 나갈까요?\n내 채팅 목록에서 대화 내용이 사라져요",
    );

    if (!confirmed || !user) return;

    setIsLeaving(true);
    try {
      await leaveChatRoom(roomId, user.uid);
      router.push("/chat");
    } catch (error) {
      console.error("채팅방 나가기 실패:", error);
      alert("채팅방을 나가지 못했어요");
    }
    setIsLeaving(false);
  };

  if (authLoading || roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={spinnerClass} role="status" aria-label="불러오는 중" />
      </div>
    );
  }
  if (!user || !chatRoom) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="text-[15px] font-semibold text-gray-900">채팅방을 찾을 수 없어요</p>
        <Link href="/chat" className={`${primaryButtonClass} mt-6 h-10 px-5 text-[15px]`}>
          채팅 목록으로
        </Link>
      </div>
    );
  }

  const otherUserId = chatRoom.participants?.find((id) => id !== user.uid);
  const otherUserName = otherUserId
    ? chatRoom.participantNames[otherUserId] || "사용자"
    : "사용자";

  return (
    <div className="h-dvh flex flex-col bg-gray-50">
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto bg-white md:border-x md:border-gray-100">
        <SubHeader
          fixed={false}
          backHref="/chat"
          title={
            <Link
              href={otherUserId ? `/users/${otherUserId}` : "#"}
              className={`inline-flex items-center gap-2 max-w-full rounded-lg ${focusRingClass}`}
            >
              <span className={`w-8 h-8 text-[13px] ${avatarClass}`} aria-hidden="true">
                {otherUserName.charAt(0)}
              </span>
              <span className="truncate">{otherUserName}</span>
            </Link>
          }
          right={
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label="채팅방 메뉴"
                aria-haspopup="menu"
                aria-expanded={showMenu}
                className={`-mr-2 ${iconButtonClass}`}
              >
                <MoreVertical className="w-5 h-5" aria-hidden="true" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div role="menu" className="absolute right-0 top-12 z-20 min-w-32 py-1 bg-white border border-gray-100 rounded-xl shadow-lg">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleLeaveChatRoom();
                      }}
                      role="menuitem"
                      className={dangerMenuItemClass}
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      나가기
                    </button>
                  </div>
                </>
              )}
            </div>
          }
        />

        {/* 채팅방 */}
        <div className="flex-1 overflow-hidden">
          <ChatRoom
            messages={messages}
            currentUserId={user.uid}
            onSendMessage={handleSendMessage}
            loading={messagesLoading}
            hasMore={canLoadOlder}
            onLoadMore={loadMoreMessages}
          />
        </div>
      </div>

      {isLeaving && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div role="status" className="bg-white rounded-xl px-6 py-4 flex items-center gap-3">
            <div className={spinnerClass} aria-hidden="true" />
            <span className="text-[15px] text-gray-900">채팅방 나가는 중</span>
          </div>
        </div>
      )}
    </div>
  );
}
