"use client";

import { quietButtonClass } from "./ui/styles";

interface LoadMoreButtonProps {
  onClick: () => void;
  label?: string;
}

export default function LoadMoreButton({ onClick, label = "더 보기" }: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center py-4">
      <button onClick={onClick} className={`${quietButtonClass} h-10 px-5 text-[15px]`}>
        {label}
      </button>
    </div>
  );
}
