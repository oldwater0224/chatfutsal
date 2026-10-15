"use client";

interface LoadMoreButtonProps {
  onClick: () => void;
  label?: string;
}

export default function LoadMoreButton({ onClick, label = "더 보기" }: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center py-4">
      <button
        onClick={onClick}
        className="h-10 px-5 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 cursor-pointer"
      >
        {label}
      </button>
    </div>
  );
}
