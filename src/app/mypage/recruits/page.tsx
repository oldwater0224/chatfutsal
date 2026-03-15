"use client";

import BottomNav from "@/src/components/BottomNav";
import { useAuth } from "@/src/hooks/useAuth";
import { useMyRecruitPosts } from "@/src/hooks/useRecruitPosts";
import { LEVEL_COLORS, LEVEL_LABELS } from "@/src/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MypageRecruit() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { posts, isLoading: postsLoading } = useMyRecruitPosts(user?.uid);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("login");
    }
  }, [authLoading, router, user]);

  if (authLoading || postsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // 모집 중과 마감 분류
  const openPosts = posts.filter((p) => p.status === "open");
  const closedPosts = posts.filter((p) => p.status === "closed");

  return (
    <>
      <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <Link href="/mypage" className="text-gray-600 mr-4 text-xl">
            ←
          </Link>
          <h1 className="font-bold">내가 작성한 용병 모집</h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="pt-14 pb-20">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <span className="text-5xl mb-4">📝</span>
            <p className="font-medium">작성한 게시글이 없어요</p>
            <Link
              href="/recruit/create"
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              용병 모집 글쓰기
            </Link>
          </div>
        ) : (
          <>
            {/* 모집 중 */}
            {openPosts.length > 0 && (
              <div>
                <div className="px-4 py-3 bg-green-50">
                  <h2 className="font-bold text-green-700">
                    모집 중 ({openPosts.length})
                  </h2>
                </div>
                {openPosts.map((post) => (
                  <Link key={post.id} href={`/recruit/${post.id}`}>
                    <div className="bg-white p-4 border-b hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 flex-1 mr-2">
                          {post.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            LEVEL_COLORS[post.level]
                          }`}
                        >
                          {LEVEL_LABELS[post.level]}
                        </span>
                      </div>

                      <div className="text-sm text-gray-500 space-y-1">
                        <p>📅 {post.date} {post.time}</p>
                        <p>📍 {post.location}</p>
                        
                      </div>

                      <div className="mt-2 text-xs text-gray-400">
                        {post.createdAt.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* 마감됨 */}
            {closedPosts.length > 0 && (
              <div className="mt-4">
                <div className="px-4 py-3 bg-gray-100">
                  <h2 className="font-bold text-gray-600">
                    마감됨 ({closedPosts.length})
                  </h2>
                </div>
                <div className="opacity-60">
                  {closedPosts.map((post) => (
                    <Link key={post.id} href={`/recruit/${post.id}`}>
                      <div className="bg-white p-4 border-b hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded">
                              마감
                            </span>
                            <h3 className="font-semibold text-gray-700">
                              {post.title}
                            </h3>
                          </div>
                        </div>

                        <div className="text-sm text-gray-500 space-y-1">
                          <p>📅 {post.date} {post.time}</p>
                          <p>📍 {post.location}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
    </>
  );
}
