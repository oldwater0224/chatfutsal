"use client";

import { useState } from "react";
import { MatchFilterProps } from "../types";



export default function MatchFilter({ filters = {date : '' , region: '' , level : ''} , onFilterChange }: MatchFilterProps) {
 
  const [isExpanded, setIsExpanded] = useState(false);

  const regions = [
    { value: "", label: "전체 지역" },
    { value: "seoul", label: "서울" },
    { value: "gyeonggi", label: "경기" },
    { value: "incheon", label: "인천" },
    { value: "busan", label: "부산" },
    { value: "daegu", label: "대구" },
    { value: "daejeon", label: "대전" },
    { value: "gwangju", label: "광주" },
  ];
  const levels = [
    { value: "", label: "전체 레벨" },
    { value: "beginner", label: "비기너" },
    { value: "amateur", label: "아마추어" },
    { value: "semi-pro", label: "세미프로" },
    { value: "pro", label: "프로" },
  ];
  // 오늘부터 7일간 날짜 생성
  const generateDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dateStr = date.toISOString().split("T")[0];
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dayName = dayNames[date.getDay()];
      const month = date.getMonth() + 1;
      const day = date.getDate();

      dates.push({
        value: dateStr,
        label: i === 0 ? "오늘" : `${month}/${day}`,
        day: dayName,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    return dates;
  };

  const dates = generateDates();

  const handleDateClick = (dateValue: string) => {
    onFilterChange({
      ...filters,
      date: filters.date === dateValue ? "" : dateValue,
    });
  };

  const handleRegionChange = (region: string) => {
    onFilterChange({ ...filters, region });
  };
  const handleLevelChange = (level: string) => {
    onFilterChange({ ...filters, level });
  };
  const handleReset = () => {
    onFilterChange({date : '' , region: '' , level: ''});
  } 

  const hasActiveFilters = filters?.date || filters?.region || filters?.level;
  return (
    <div className="bg-white border-b sticky top-14 z-40">
      {/* 날짜 필터 */}
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {dates.map((date) => (
            <button
              key={date.value}
              onClick={() => handleDateClick(date.value)}
              className={`fx-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.date === date.value
                  ? 'bg-green-600 text-white'
                  : date.isWeekend
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="block">{date.label}</span>
              <span className="block text-xs opacity-75">{date.day}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 추가 필터 토글 */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <span>필터</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          )}
          <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* 확장된 필터 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3">
          {/* 지역 필터 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              지역
            </label>
            <div className="flex gap-2 flex-wrap">
              {regions.map((region) => (
                <button
                  key={region.value}
                  onClick={() => handleRegionChange(region.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    filters.region === region.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {region.label}
                </button>
              ))}
            </div>
          </div>

          {/* 레벨 필터 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              실력
            </label>
            <div className="flex gap-2 flex-wrap">
              {levels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => handleLevelChange(level.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    filters.level === level.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* 필터 초기화 */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-sm text-red-500 hover:text-red-600"
            >
              필터 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}
