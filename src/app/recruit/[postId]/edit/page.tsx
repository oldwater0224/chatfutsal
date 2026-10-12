"use client";

import SubHeader, { headerActionButtonClass } from "@/src/components/SubHeader";
import { fieldInputClass, fieldLabelClass, fieldTextareaClass, spinnerClass } from "@/src/components/ui/styles";
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
            alert("수정 권한이 없습니다.");
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
          alert("게시글을 찾을 수 없습니다.");
          router.push("/");
        }
      } catch (error) {
        console.error("게시글 불러오기 실패", error);
        alert("게시글을 불러오는데에 실패했습니다.");
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
      alert("경기 날짜를 선택해주세요.");
      return;
    }
    if (!formData.time) {
      alert("경기 시간을 선택해주세요.");
      return;
    }
    //지도 선택 확인
    if (!formData.location.trim() || formData.locationCoord.lat === 0) {
      alert("구장을 지도에서 선택해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateRecruitPost(postId, formData);
      alert("게시글이 수정 되었습니다.");
      router.push(`/recruit/${postId}`);
    } catch (error) {
      console.error("게시글 수정 실패", error);
      alert("게시글 수정에 실패했습니다.");
    }
    setIsSubmitting(false);
  };

  if (authLoading || isLoading) {
    //둘 중 하나라도 로딩 중이면
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={spinnerClass} />
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
            {isSubmitting ? "수정 중..." : "완료"}
          </button>
        }
      />

      {/* 폼 */}
      <main className="pt-14 pb-16 px-4 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-7 pt-6">
          {/* 제목 */}
          <div>
            <label className={fieldLabelClass}>
              제목 *
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="예: 토요일 저녁 풋살 용병 구합니다"
              className={fieldInputClass}
              maxLength={50}
            />
          </div>

          {/* 경기 날짜 & 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabelClass}>
                경기 날짜 *
              </label>
              <input
                required
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
              <label className={fieldLabelClass}>
                경기 시간 *
              </label>
              <input
                required
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className={fieldInputClass}
              />
            </div>
          </div>

          {/* 👇 구장 선택 (지도) - 수정된 부분 */}
          <div>
            <label className={fieldLabelClass}>
              구장 선택 *
            </label>
            <KakaoMapSearch
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
            <label className={fieldLabelClass}>
              실력 수준 *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, level: level.value })
                  }
                  className={`h-11 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                    formData.level === level.value
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-green-600"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* 모집 인원 */}
          <div>
            <label className={fieldLabelClass}>
              모집 인원 *
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    needCount: Math.max(1, formData.needCount - 1),
                  })
                }
                className="w-10 h-10 rounded-full border border-gray-200 text-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                -
              </button>
              <span className="text-xl font-bold w-10 text-center">
                {formData.needCount}
              </span>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    needCount: Math.min(10, formData.needCount + 1),
                  })
                }
                className="w-10 h-10 rounded-full border border-gray-200 text-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                +
              </button>
              <span className="text-gray-500">명</span>
            </div>
          </div>

          {/* 상세 내용 */}
          <div>
            <label className={fieldLabelClass}>
              상세 내용
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="추가로 알려주고 싶은 내용을 작성해주세요"
              rows={5}
              className={fieldTextareaClass}
            />
          </div>
        </form>
      </main>
    </div>
  );
}
