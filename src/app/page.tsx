"use client";

import { useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useRecruitPosts } from "@/src/hooks/useRecruitPosts";
import Header from "@/src/components/Header";
import BottomNav from "@/src/components/BottomNav";
import RecruitFilter from "@/src/components/RecruitFilter";
import RecruitCard from "@/src/components/RecruitCard";
import Link from "next/link";

interface FilterState {
  date: string;
  region: string;
  level: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    date: "",
    region: "",
    level: "",
  });

  const { posts, isLoading } = useRecruitPosts(filters);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-14 pb-20">
        {/* 페이지 헤더 */}
        <div className="bg-white border-b">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-bold">용병 모집</h1>
            {user && (
              <Link
                href="/create"
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700"
              >
                <span>+</span>
                <span>글쓰기</span>
              </Link>
            )}
          </div>
        </div>

        {/* 필터 */}
        <RecruitFilter filters={filters} onFilterChange={handleFilterChange} />

        {/* 모집글 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-5xl mb-4">⚽</span>
            <p className="text-gray-700 font-medium mb-1">모집 글이 없어요</p>
            <p className="text-gray-500 text-sm mb-4">
              첫 번째 용병 모집 글을 작성해보세요!
            </p>
            {user && (
              <Link
                href="/create"
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                글쓰기
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white">
            <div className="px-4 py-6 text-sm max-w-2xl mx-auto">
              {posts.length}개의 모집
            </div>

            <div className="space-y-4 px-4 pb-4">
              {posts.map((post) => (
                <RecruitCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
