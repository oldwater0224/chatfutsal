"use client";

import { ChevronDown, RotateCcw } from "lucide-react";

interface FilterState {
  date: string;
  region: string;
  level: string;
}

interface RecruitFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export default function RecruitFilter({
  filters = { date: "", region: "", level: "" },
  onFilterChange,
}: RecruitFilterProps) {
  const regions = [
    { value: "", label: "전체 지역" },
    { value: "서울", label: "서울" },
    { value: "경기", label: "경기" },
    { value: "인천", label: "인천" },
    { value: "부산", label: "부산" },
    { value: "대구", label: "대구" },
    { value: "대전", label: "대전" },
    { value: "광주", label: "광주" },
  ];
  const levels = [
    { value: "", label: "전체 레벨" },
    { value: "beginner", label: "비기너" },
    { value: "amateur", label: "아마추어" },
    { value: "semipro", label: "세미프로" },
    { value: "pro", label: "프로" },
  ];

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
    onFilterChange({ date: "", region: "", level: "" });
  };

  return (
    <div className="bg-white">
      <div className="bg-white sticky top-14 z-40">
        <div className="px-4 py-3 overflow-hidden mx-auto w-full max-w-2xl">
          <div className="flex justify-between gap-2 overflow-x-auto scrollbar-hide">
            {dates.map((date) => (
              <button
                key={date.value}
                onClick={() => handleDateClick(date.value)}
                className={`shrink-0 px-4 py-2 rounded-2xl text-md font-medium hover:cursor-pointer
                  ${
                    filters.date === date.value
                      ? "bg-green-600 text-white"
                      : date.isWeekend
                        ? "text-red-600"
                        : "text-gray-700"
                  }`}
              >
                <span className="block">{date.label}</span>
                <span className="block text-xs opacity-75">{date.day}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4 flex items-center gap-2 max-w-2xl mx-auto">
          <div className="relative">
            <select
              value={filters.region}
              onChange={(e) => handleRegionChange(e.target.value)}
              aria-label="지역 필터"
              className={`appearance-none pl-3 pr-7 py-1.5 rounded-full text-sm transition-colors hover:cursor-pointer focus:outline-none ${
                filters.region
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {regions.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                filters.region ? "text-white" : "text-gray-500"
              }`}
            />
          </div>

          <div className="relative">
            <select
              value={filters.level}
              onChange={(e) => handleLevelChange(e.target.value)}
              aria-label="레벨 필터"
              className={`appearance-none pl-3 pr-7 py-1.5 rounded-full text-sm transition-colors hover:cursor-pointer focus:outline-none ${
                filters.level
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {levels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                filters.level ? "text-white" : "text-gray-500"
              }`}
            />
          </div>

          <button
            onClick={handleReset}
            className=" text-sm text-red-500 hover:text-red-600 hover:cursor-pointer"
          >
              <RotateCcw className="w-5 h-4"/>
          </button>
        </div>
      </div>
    </div>
  );
}
