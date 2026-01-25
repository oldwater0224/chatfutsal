"use client";

import { useState } from "react";
import { MatchFilterProps } from "../types";

export default function MatchFilter({onFilterChange} : MatchFilterProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [region, setRegion] = useState("all");

  const regions = [
    { value: "all", label: "전체 지역" },
    { value: "seoul", label: "서울" },
    { value: "gyeonggi", label: "경기" },
    { value: "incheon", label: "인천" },
    { value: "busan", label: "부산" },
  ];

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    onFilterChange({ date: newDate, region });
  };

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    onFilterChange({ date, region: newRegion });
  };
  return (
     <div className="bg-white p-4 border-b border-gray-200 space-y-3">
      <div>
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {regions.map((r) => (
          <button
            key={r.value}
            onClick={() => handleRegionChange(r.value)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              region === r.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
