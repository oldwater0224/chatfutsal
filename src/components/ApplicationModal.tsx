"use client";

import { useState } from "react";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  postTitle: string;
}

export default function ApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  postTitle,
}: ApplicationModalProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(message);
      setMessage("");
      onClose();
    } catch {
      alert("신청에 실패했습니다. 다시 시도해주세요.");
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">참가 신청</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-1">{postTitle}</p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="작성자에게 전할 메시지 (선택)"
          rows={3}
          maxLength={100}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{message.length}/100</p>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? "신청 중..." : "신청하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
