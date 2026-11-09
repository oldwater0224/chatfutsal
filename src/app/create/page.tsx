"use client";

import SubHeader, { headerActionButtonClass } from "@/src/components/SubHeader";
import {
  fieldInputClass,
  fieldLabelClass,
  fieldTextareaClass,
  focusRingClass,
  spinnerClass,
} from "@/src/components/ui/styles";
import { Minus, Plus } from "lucide-react";
import KakaoMapSearch from "@/src/components/KakaoMapSearch";
import { useAuth } from "@/src/hooks/useAuth";
import { createRecruitPost } from "@/src/lib/services";
import { LEVEL_LABELS } from "@/src/types";
import { getTodayString } from "@/src/lib/utils/dateUtils";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LEVELS = Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }));

const stepperButtonClass = `w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-900 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default transition-colors ${focusRingClass}`;


export default function CreateRecruitPage() {
  const { user, userData, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    date: "",
    time: "",
    location: "",
    locationCoord: {
      lat: 0,
      lng: 0,
      address: "",
    },
    level: "amateur",
    needCount: 1,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, router, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userData) return;

    //유효성 검사
    if (!formData.title.trim()) {
      alert("제목을 입력해 주세요");
      return;
    }
    if (!formData.date) {
      alert("경기 날짜를 선택해 주세요");
      return;
    }
    if (!formData.time) {
      alert("경기 시간을 선택해 주세요");
      return;
    }
    if (!formData.location.trim() || formData.locationCoord.lat === 0) {
      alert("구장을 지도에서 선택해 주세요");
      return;
    }
    setIsSubmitting(true);

    try {
      await createRecruitPost(
        user.uid,
        userData.displayName || "사용자",
        formData,
      );
      alert("모집글을 올렸어요");
      router.push("/");
    } catch (error) {
      console.error("게시글 등록 실패:", error);
      alert("모집글을 올리지 못했어요. 다시 시도해 주세요");
    }
    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={spinnerClass} role="status" aria-label="불러오는 중" />
      </div>
    );
  }

  if (!user) return null;

  const today = getTodayString();

  return (
    <div className="min-h-screen bg-white">
      <SubHeader
        title="용병 모집 글쓰기"
        backHref="/"
        right={
          <button onClick={handleSubmit} disabled={isSubmitting} className={headerActionButtonClass}>
            {isSubmitting ? "등록 중" : "등록"}
          </button>
        }
      />

      {/* 폼 */}
      <main className="pt-14 pb-16 px-4 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8 pt-6">
          {/* 제목 */}
          <div>
            <label htmlFor="title" className={fieldLabelClass}>
              제목
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="예: 토요일 저녁 풋살 용병 구해요"
              className={fieldInputClass}
              maxLength={50}
            />
          </div>

          {/* 경기 날짜 & 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className={fieldLabelClass}>
                경기 날짜
              </label>
              <input
                id="date"
                type="date"
                value={formData.date}
                min={today}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className={fieldInputClass}
              />
            </div>
            <div>
              <label htmlFor="time" className={fieldLabelClass}>
                경기 시간
              </label>
              <input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className={fieldInputClass}
              />
            </div>
          </div>

          {/* 장소 */}
          <div>
            <label htmlFor="location-search" className={fieldLabelClass}>
              구장 선택
            </label>
            <KakaoMapSearch
              inputId="location-search"
              onSelect={(loc) => {
                setFormData({
                  ...formData,
                  location: loc.name,
                  locationCoord: {
                    lat: loc.lat,
                    lng: loc.lng,
                    address: loc.address,
                  },
                });
              }}
            />
          </div>

          {/* 레벨 */}
          <div>
            <p id="level-label" className={fieldLabelClass}>
              실력 수준
            </p>
            <div role="group" aria-labelledby="level-label" className="grid grid-cols-4 gap-2">
              {LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, level: level.value })
                  }
                  aria-pressed={formData.level === level.value}
                  className={`h-12 rounded-lg text-[15px] font-medium border transition-colors cursor-pointer ${focusRingClass} ${
                    formData.level === level.value
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* 모집 인원 */}
          <div>
            <p id="needcount-label" className={fieldLabelClass}>
              모집 인원
            </p>
            <div role="group" aria-labelledby="needcount-label" className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    needCount: Math.max(1, formData.needCount - 1),
                  })
                }
                disabled={formData.needCount <= 1}
                aria-label="인원 줄이기"
                className={stepperButtonClass}
              >
                <Minus className="w-5 h-5" aria-hidden="true" />
              </button>
              <output
                aria-live="polite"
                className="w-10 text-center text-[22px] font-semibold text-gray-900 tabular-nums"
              >
                {formData.needCount}
              </output>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    needCount: Math.min(10, formData.needCount + 1),
                  })
                }
                disabled={formData.needCount >= 10}
                aria-label="인원 늘리기"
                className={stepperButtonClass}
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
              </button>
              <span className="text-[15px] text-gray-600">명</span>
            </div>
          </div>

          {/* 상세 내용 */}
          <div>
            <label htmlFor="content" className={fieldLabelClass}>
              상세 내용 <span className="font-normal text-gray-500">(선택)</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="추가로 알려주고 싶은 내용"
              rows={5}
              className={fieldTextareaClass}
            />
          </div>
        </form>
      </main>
    </div>
  );
}
