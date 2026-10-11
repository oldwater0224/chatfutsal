"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

export interface FilterState {
  date: string;
  region: string;
  level: string;
  keyword: string;
}

interface RecruitFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const REGIONS = [
  { value: "", label: "전체 지역" },
  { value: "서울", label: "서울" },
  { value: "경기", label: "경기" },
  { value: "인천", label: "인천" },
  { value: "부산", label: "부산" },
  { value: "대구", label: "대구" },
  { value: "대전", label: "대전" },
  { value: "광주", label: "광주" },
];

const LEVELS = [
  { value: "", label: "전체 레벨" },
  { value: "beginner", label: "비기너" },
  { value: "amateur", label: "아마추어" },
  { value: "semipro", label: "세미프로" },
  { value: "pro", label: "프로" },
];

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function toLocalDateString(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function generateDates() {
  const today = new Date();
  return Array.from({ length: DAYS_PER_WEEK * WEEK_COUNT }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return {
      value: toLocalDateString(date),
      day: i === 0 ? "오늘" : DAY_NAMES[date.getDay()],
      num: date.getDate(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });
}

function WeekArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "이전 주" : "다음 주"}
      className="shrink-0 w-10 h-14 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer disabled:text-gray-200 disabled:cursor-default disabled:hover:bg-transparent"
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

function FilterSelect({
  value,
  options,
  label,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  label: string;
  onChange: (value: string) => void;
}) {
  const active = value !== "";
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`appearance-none h-10 pl-3 pr-7 rounded-full text-[13px] font-medium cursor-pointer focus:outline-none transition-colors ${
          active
            ? "bg-green-600 text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${
          active ? "text-white" : "text-gray-400"
        }`}
      />
    </div>
  );
}

const DAYS_PER_WEEK = 7;
const WEEK_COUNT = 2;

export default function RecruitFilter({ filters, onFilterChange }: RecruitFilterProps) {
  const [week, setWeek] = useState(0);
  const dates = generateDates().slice(week * DAYS_PER_WEEK, (week + 1) * DAYS_PER_WEEK);
  const hasActiveFilter = !!(filters.date || filters.region || filters.level);

  const handleDateClick = (value: string) => {
    onFilterChange({ ...filters, date: filters.date === value ? "" : value });
  };

  const handleReset = () => {
    onFilterChange({ date: "", region: "", level: "", keyword: filters.keyword });
  };

  return (
    <div className="sticky top-14 z-40 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-1 px-2 py-2">
          <WeekArrow
            direction="prev"
            disabled={week === 0}
            onClick={() => setWeek((w) => w - 1)}
          />
          <div className="flex-1 grid grid-cols-7 gap-1.5">
            {dates.map((date) => {
              const selected = filters.date === date.value;
              return (
                <button
                  key={date.value}
                  onClick={() => handleDateClick(date.value)}
                  aria-pressed={selected}
                  className={`h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                    selected ? "bg-green-600 text-white" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <span
                    className={`text-[11px] font-medium ${
                      selected ? "text-white/90" : date.isWeekend ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    {date.day}
                  </span>
                  <span
                    className={`text-base font-bold leading-none ${
                      selected ? "text-white" : date.isWeekend ? "text-red-500" : "text-gray-900"
                    }`}
                  >
                    {date.num}
                  </span>
                </button>
              );
            })}
          </div>
          <WeekArrow
            direction="next"
            disabled={week === WEEK_COUNT - 1}
            onClick={() => setWeek((w) => w + 1)}
          />
        </div>

        <div className="flex items-center gap-2 px-4 pt-1 pb-3 border-b border-gray-100">
          <FilterSelect
            value={filters.region}
            options={REGIONS}
            label="지역 필터"
            onChange={(region) => onFilterChange({ ...filters, region })}
          />
          <FilterSelect
            value={filters.level}
            options={LEVELS}
            label="레벨 필터"
            onChange={(level) => onFilterChange({ ...filters, level })}
          />
          {hasActiveFilter && (
            <button
              onClick={handleReset}
              className="shrink-0 h-10 px-3 flex items-center gap-1 rounded-full text-[13px] text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
