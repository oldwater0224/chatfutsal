"use client";

import BottomNav from "@/src/components/BottomNav";
import MatchCard from "@/src/components/MatchCard";
import { useAuth } from "@/src/hooks/useAuth";
import { useMyMatches } from "@/src/hooks/useMyMatches";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MyMatchesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { matches, isLoading: matchesLoading, error } = useMyMatches(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || matchesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if(!user) return null;

  // 날짜 기준으로 분류
  const today = new Date().toISOString().split('T')[0];
  const upcomingMatches = matches.filter((m) => m.date >= today);
  const pastMatches = matches.filter((m) => m.date < today);

  return (
     <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="max-w-md px-4 h-14 flex items-center">
          <Link href="/mypage" className="text-gray-600 mr-4">
            ←
          </Link>
          <h1 className="font-bold">참가 신청한 매치</h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="pt-14 pb-16">
        {error ? (
          <div className="flex justify-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <span className="text-4xl mb-4">⚽</span>
            <p>참가 신청한 매치가 없어요</p>
            <Link href="/" className="mt-4 text-green-600 font-medium">
              매치 둘러보기 →
            </Link>
          </div>
        ) : (
          <>
            {/* 예정된 매치 */}
            {upcomingMatches.length > 0 && (
              <div>
                <div className="px-4 py-3 bg-green-50">
                  <h2 className="font-bold text-green-700">
                    예정된 매치 ({upcomingMatches.length})
                  </h2>
                </div>
                {upcomingMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}

            {/* 지난 매치 */}
            {pastMatches.length > 0 && (
              <div className="mt-4">
                <div className="px-4 py-3 bg-gray-100">
                  <h2 className="font-bold text-gray-600">
                    지난 매치 ({pastMatches.length})
                  </h2>
                </div>
                {pastMatches.map((match) => (
                  <div key={match.id} className="opacity-60">
                    <MatchCard match={match} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
