"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
}

interface ChatRoomProps {
  roomId: string;
  currentUserId: string;
  message: Message[];
  onSendMessage: (text: string) => void;
}

export default function ChatRoom({
  roomId,
  currentUserId,
  message,
  onSendMessage,
}: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  // 새 메세지가 오면 스크롤을 아래로
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    onSendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {message.map((msg) => {
          const isMe = msg.senderId === currentUserId;

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  isMe
                    ? "bg-green-500 text-white rounded-br-md"
                    : "bg-white text-gray-900 rounded-bl-md"
                }`}
              >
                {!isMe && (
                  <p className="text-xs text-gray-500 mb-1">{msg.senderName}</p>
                )}
                <p className="text-sm">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    isMe ? "text-green-100" : "text-gray-400"
                  }`}
                >
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {/* 입력창 */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white border-t flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-green-500 text-white rounded-full disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </div>
  );
}
function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
