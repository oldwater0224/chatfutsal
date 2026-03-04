"use client";

import KakaoMap from "@/src/components/KakaoMap";
import { useAuth } from "@/src/hooks/useAuth";
import { useMatch } from "@/src/hooks/useMatch";
import { joinMatch, leaveMatch } from "@/src/lib/matchService";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const { user } = useAuth();
  const { match, isLoading, error } = useMatch(matchId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const levelLabels: Record<string, string> = {
    beginner: "비기너",
    amateur: "아마추어",
    semipro: "세미프로",
    pro: "프로",
  };

  const levelColors: Record<string, string> = {
    beginner: "bg-green-100 text-green-700",
    amateur: "bg-blue-100 text-blue-700",
    semipro: "bg-purple-100 text-purple-700",
    pro: "bg-red-100 text-red-700",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }
  if (error || !match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || "매치를 찾을 수 없습니다"}</p>
        <Link href="/" className="text-green-600">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const isFull = match.currentParticipants >= match.maxParticipants;
  const isParticipant = user && match.participants.includes(user.uid);

  const handleJoin = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    // 참가 신청 로직 구현
    setIsSubmitting(true);
    try {
      await joinMatch(matchId, user.uid);
      alert("참가 신청이 완료 되었습니다.");
    } catch (e) {
      console.error("참가 신청 에러:", e);
      alert("참가 신청에 실패했습니다.");
    }
    setIsSubmitting(false);
  };
  const handleLeave = async () => {
    if (!user) return;

    const confirmed = window.confirm("참가를 취소하시겠습니까?");
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await leaveMatch(matchId, user.uid);
      alert("참가가 취소되었습니다.");
    } catch (e) {
      console.error("참가 신청 에러:", e);
      alert("참가 취소에 실패했습니다.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="fixed top-0 left-0  right-0 bg-white border-b z-50">
        <div className="max-w-md  px-4 h-14 flex items-center">
          <Link href="/" className="text-gray-600 mr-4">
            ←
          </Link>
          <h1 className="font-bold">매치 상세</h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="pt-14 pb-24 px-4">
        {/* 매치 정보 카드 */}
        <div className="mt-4 bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900">{match.title}</h2>
            <span
              className={`px-2 py-1 rounded text-xs ${levelColors[match.level]}`}
            >
              {levelLabels[match.level]}
            </span>
          </div>

          <div className="space-y-3 text-gray-600">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>
                {match.date} {match.time}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{match.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span className={isFull ? "text-red-500" : "text-green-600"}>
                {match.currentParticipants}/{match.maxParticipants}명
                {isFull && " (마감)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>💰</span>
              <span>{match.price.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 지도 영역  */}
        <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-bold mb-3">구장 위치</h3>
          {match.lat && match.lng ? (
            <KakaoMap lat={match.lat} lng={match.lng} address={match.address} />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
              위치 정보가 없습니다.
            </div>
          )}
        </div>

        {/* 참가자 목록 */}
        <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-bold mb-3">
            참가자 ({match.currentParticipants}명)
          </h3>

          {match.participants.length === 0 ? (
            <p className="text-gray-500 text-sm">아직 참가자가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {match.participants.map((participantId, index) => (
                <Link
                  key={participantId}
                  href={`/users/${participantId}`}
                  className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200"
                >
                  <span className="text-green-600 text-sm font-medium">
                    {index + 1}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 하단 참가 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-md mx-auto">
          {isParticipant ? (
            <button
              onClick={handleLeave}
              disabled={isSubmitting}
              className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
            >
              {isSubmitting ? "처리 중..." : "참가 취소하기"}
            </button>
          ) : isFull ? (
            <button
              disabled
              className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg font-medium"
            >
              마감되었습니다
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={isSubmitting}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting
                ? "처리 중..."
                : `참가 신청하기 (${match.price.toLocaleString()}원)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
