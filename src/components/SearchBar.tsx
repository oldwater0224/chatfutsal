"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { iconButtonBaseClass, searchInputClass } from "./ui/styles";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  // 입력 중인 값과 그 값을 입력할 때의 부모 value를 함께 둔다.
  // 부모 value가 바뀌면(외부 초기화 등) 입력값 대신 새 value를 보여준다 (effect로 동기화하지 않는다)
  const [draft, setDraft] = useState({ source: value, text: value });
  const localValue = draft.source === value ? draft.text : value;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 언마운트 후 남은 디바운스 호출이 실행되지 않게 타이머만 정리한다
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (newValue: string) => {
    setDraft({ source: value, text: newValue });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      // 부모에 보낸 값을 source로 맞춰 둔다. 그래야 이후 부모가 이전 값으로 되돌릴 때(필터 초기화 등)
      // source와 달라져 부모 값이 화면에 반영된다
      setDraft({ source: newValue, text: newValue });
      onChange(newValue);
    }, 300);
  };

  const handleClear = () => {
    // 대기 중인 디바운스가 지운 뒤에 옛 검색어를 다시 보내지 않게 취소한다
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDraft({ source: "", text: "" });
    onChange("");
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="제목, 내용, 장소로 검색"
        aria-label="모집글 검색"
        className={`${searchInputClass} h-10 pl-10 pr-10`}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="검색어 지우기"
          className={`absolute right-0 top-1/2 -translate-y-1/2 ${iconButtonBaseClass} text-gray-500 hover:text-gray-700`}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
