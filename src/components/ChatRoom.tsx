'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/src/types';

interface ChatRoomProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  loading?: boolean;
}

export default function ChatRoom({
  messages,
  currentUserId,
  onSendMessage,
  loading,
}: ChatRoomProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>대화를 시작해보세요!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === currentUserId;
            const isRead = message.readBy && message.readBy.length > 1;

            return (
              <div
                key={message.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    isMe
                      ? 'bg-green-500 text-white rounded-l-2xl rounded-tr-2xl'
                      : 'bg-white text-gray-900 rounded-r-2xl rounded-tl-2xl border'
                  } px-4 py-2 shadow-sm`}
                >
                  <p className="wrap-break-words">{message.text}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isMe ? 'text-green-100' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </span>
                    {/* 읽음 표시 (내가 보낸 메시지만) */}
                    {isMe && (
                      <span className="text-xs text-green-100">
                        {isRead ? '읽음' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          전송
        </button>
      </form>
    </div>
  );
}