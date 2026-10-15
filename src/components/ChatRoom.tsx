'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/src/types';
import { spinnerClass } from './ui/styles';

interface ChatRoomProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function ChatRoom({
  messages,
  currentUserId,
  onSendMessage,
  loading,
  hasMore,
  onLoadMore,
}: ChatRoomProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages[messages.length - 1]?.id;

  // 새 메시지가 아래에 추가될 때만 스크롤 (이전 메시지를 불러올 때는 위치 유지)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageId]);

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
        <div className={spinnerClass} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {hasMore && onLoadMore && (
          <div className="flex justify-center">
            <button
              onClick={onLoadMore}
              className="h-8 px-4 rounded-full bg-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-200 cursor-pointer"
            >
              이전 메시지 보기
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-sm">대화를 시작해보세요</p>
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
                      ? 'bg-green-600 text-white rounded-l-2xl rounded-tr-2xl'
                      : 'bg-gray-100 text-gray-900 rounded-r-2xl rounded-tl-2xl'
                  } px-4 py-2 text-[15px]`}
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
        className="p-3 bg-white border-t border-gray-100 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 h-11 px-4 bg-gray-100 rounded-full text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600/30"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="h-11 px-5 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
        >
          전송
        </button>
      </form>
    </div>
  );
}