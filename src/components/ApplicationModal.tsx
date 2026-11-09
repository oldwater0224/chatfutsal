"use client";

import { useState } from "react";
import { ApplicationError } from "../lib/services";
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
    } catch (e) {
      alert(e instanceof ApplicationError ? e.message : "신청하지 못했어요. 다시 시도해 주세요");
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-title"
        className="relative w-full sm:max-w-sm sm:mx-4 bg-white rounded-t-2xl sm:rounded-2xl p-6"
      >
        <h3 id="apply-title" className="text-[17px] font-semibold text-gray-900">참가 신청</h3>
        <p className="mt-1 mb-4 text-[13px] text-gray-600 line-clamp-1">{postTitle}</p>

        <label htmlFor="apply-message" className="sr-only">
          작성자에게 전할 메시지
        </label>
        <textarea
          id="apply-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="작성자에게 전할 메시지 (선택)"
          rows={3}
          maxLength={100}
          className={fieldTextareaClass}
        />
        <p className="mt-1 text-xs text-gray-500 text-right tabular-nums" aria-live="polite">
          {message.length}/100
        </p>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleClose}
            className={`${secondaryButtonClass} flex-1 h-12 text-[15px]`}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`${primaryButtonClass} flex-1 h-12 text-[15px]`}
          >
            {isSubmitting ? "신청하는 중" : "신청하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
