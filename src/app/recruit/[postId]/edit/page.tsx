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
import { useAuth } from "@/src/hooks/useAuth";
import { db } from "@/src/lib/firebase";
import { updateRecruitPost } from "@/src/lib/services";
import { LEVEL_LABELS, RecruitPost } from "@/src/types";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import KakaoMapSearch from "@/src/components/KakaoMapSearch";
import { getTodayString } from "@/src/lib/utils/dateUtils";

const LEVELS = Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value: value as RecruitPost["level"], label }));

const stepperButtonClass = `w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-900 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default transition-colors ${focusRingClass}`;


export default function EditRecruitPage() {
  const params = useParams();
  const router = useRouter();

  const postId = params.postId as string;

  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    date: string;
    time: string;
    location: string;
    locationCoord: {
      lat: number;
      lng: number;
      address: string;
    };
    level: RecruitPost["level"];
    needCount: number;
  }>({
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

  // 기존 데이터 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = doc(db, "recruitPosts", postId);
        const snapshot = await getDoc(postRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as RecruitPost;

          // 작성자 확인
          if (user && data.authorId !== user.uid) {
            alert("이 글을 수정할 권한이 없어요");
            router.push(`/recruit/${postId}`);
            return;
          }

          setFormData({
            title: data.title || "",
            content: data.content || "",
            date: data.date || "",
            time: data.time || "",
            location: data.location || "",
            locationCoord: data.locationCoord || {
              
              lat: 0,
              lng: 0,
              address: "",
            },
            level: data.level || "amateur",
            needCount: data.needCount || 1,
          });
        } else {
          alert("모집글을 찾을 수 없어요");
          router.push("/");
        }
      } catch (error) {
        console.error("게시글 불러오기 실패", error);
        alert("모집글을 불러오지 못했어요");
      }
      setIsLoading(false);
    };

    if (!authLoading && user) {
      fetchPost();
    }
  }, [authLoading, postId, router, user]);

  // 로그인 체크
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

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
    //지도 선택 확인
    if (!formData.location.trim() || formData.locationCoord.lat === 0) {
      alert("구장을 지도에서 선택해 주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateRecruitPost(postId, formData);
      alert("모집글을 수정했어요");
      router.push(`/recruit/${postId}`);
    } catch (error) {
      console.error("게시글 수정 실패", error);
      alert("모집글을 수정하지 못했어요");
    }
    setIsSubmitting(false);
  };

  if (authLoading || isLoading) {
    //둘 중 하나라도 로딩 중이면
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={spinnerClass} role="status" aria-label="불러오는 중" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      <SubHeader
        title="모집글 수정"
        backHref={`/recruit/${postId}`}
        right={
          <button onClick={handleSubmit} disabled={isSubmitting} className={headerActionButtonClass}>
            {isSubmitting ? "저장 중" : "완료"}
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
              required
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
                required
                id="date"
                type="date"
                value={formData.date}
                min={getTodayString()}
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
                required
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

          {/* 구장 선택 (지도) */}
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
              initialLocation={
                formData.locationCoord.lat !== 0
                  ? {
                      name: formData.location,
                      address: formData.locationCoord.address,
                      lat: formData.locationCoord.lat,
                      lng: formData.locationCoord.lng,
                    }
                  : null
              }
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
