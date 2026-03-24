"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { db } from "@/src/lib/firebase";
import { updateRecruitPost } from "@/src/lib/services";
import { RecruitPost } from "@/src/types";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const level_labels = [
  { value: "beginner", label: "비기너" },
  { value: "amateur", label: "아마추어" },
  { value: "semipro", label: "세미프로" },
  { value: "pro", label: "프로" },
] as const;

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
  level: typeof level_labels[number]['value']
  needCount: number;
}>({
  title: "",
  content: "",
  date: "",
  time: "",
  location: "",
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
            level: data.level || "amateur",
            needCount: data.needCount || 1,
          });
        } else {
          alert("게시글을 찾을 수 없습니다.");
          router.push("/recruit");
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
    if (!formData.location.trim()) {
      alert("장소를 입력해주세요.");
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

  if (authLoading && isLoading) {
    return (
      <div className="min-h-screen , flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/recruit/${postId}`} className="text-gray-600 text-xl">
              ←
            </Link>
            <h1 className="font-bold">게시글 수정</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300"
          >
            {isSubmitting ? "수정 중..." : "완료"}
          </button>
        </div>
      </header>

      {/* 폼 */}
      <main className="pt-14 pb-10 px-4">
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="예: 토요일 저녁 풋살 용병 구합니다"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              maxLength={50}
            />
          </div>

          {/* 경기 날짜 & 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                경기 날짜 *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                경기 시간 *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* 장소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              장소 *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="예: 강남 OO풋살장"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* 레벨 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              실력 수준 *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {level_labels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, level: level.value })
                  }
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    formData.level === level.value
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-green-500"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* 모집 인원 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300"
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
                className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300"
              >
                +
              </button>
              <span className="text-gray-500">명</span>
            </div>
          </div>

          {/* 상세 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상세 내용
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="추가로 알려주고 싶은 내용을 작성해주세요"
              rows={5}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
        </form>
      </main>
    </div>
  );
}
