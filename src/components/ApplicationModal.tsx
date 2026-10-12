"use client";

import { useState } from "react";
import { fieldTextareaClass, primaryButtonClass, secondaryButtonClass } from "./ui/styles";

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative w-full sm:max-w-sm sm:mx-4 bg-white rounded-t-2xl sm:rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">참가 신청</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-1">{postTitle}</p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="작성자에게 전할 메시지 (선택)"
          rows={3}
          maxLength={100}
          className={fieldTextareaClass}
        />
        <p className="text-xs text-gray-400 text-right mt-1">{message.length}/100</p>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleClose}
            className={`${secondaryButtonClass} flex-1 h-12`}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`${primaryButtonClass} flex-1 h-12`}
          >
            {isSubmitting ? "신청 중..." : "신청하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
