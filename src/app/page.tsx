"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useRecruitPosts } from "@/src/hooks/useRecruitPosts";
import Header from "@/src/components/Header";
import BottomNav from "@/src/components/BottomNav";
import RecruitFilter, { FilterState } from "@/src/components/RecruitFilter";
import RecruitCard from "@/src/components/RecruitCard";
import LoadMoreButton from "@/src/components/LoadMoreButton";
import SearchBar from "@/src/components/SearchBar";
import Link from "next/link";
import { CalendarSearch, LogIn, Plus } from "lucide-react";
import { RecruitPost } from "@/src/types";
import { formatMatchDate } from "@/src/lib/utils/dateUtils";
import {
  emptyIconTileClass,
  fabClass,
  primaryButtonClass,
  quietButtonClass,
  secondaryButtonClass,
  spinnerClass,
} from "@/src/components/ui/styles";

function groupByDate(posts: RecruitPost[]) {
  const sorted = [...posts].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
  const groups: { date: string; posts: RecruitPost[] }[] = [];
  for (const post of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === post.date) last.posts.push(post);
    else groups.push({ date: post.date, posts: [post] });
  }
  return groups;
}

const EMPTY_FILTERS: FilterState = { date: "", region: "", level: "", keyword: "" };

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const { posts, isLoading, permissionDenied, hasMore, loadingMore, loadMore } = useRecruitPosts(filters, {
    ready: !authLoading,
    uid: user?.uid,
  });
  const groups = useMemo(() => groupByDate(posts), [posts]);
  const hasAnyFilter = !!(filters.date || filters.region || filters.level || filters.keyword);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-14 pb-36">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-2">
          <h1 className="text-[22px] font-semibold text-gray-900">용병 모집</h1>
          <div className="mt-4">
            <SearchBar
              value={filters.keyword}
              onChange={(keyword) => setFilters((prev) => ({ ...prev, keyword }))}
            />
          </div>
        </div>

        <RecruitFilter filters={filters} onFilterChange={setFilters} />

        <div className="max-w-2xl mx-auto px-4">
          {authLoading || isLoading || (posts.length === 0 && loadingMore) ? (
            <div className="flex items-center justify-center py-24">
              <div className={spinnerClass} role="status" aria-label="불러오는 중" />
            </div>
          ) : permissionDenied && !user ? (
            <div className="flex flex-col items-center text-center py-20">
              <div className={emptyIconTileClass}>
                <LogIn className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-[15px] font-semibold text-gray-900">로그인하면 모집글을 볼 수 있어요</p>
              <p className="mt-1 text-[13px] text-gray-600">카카오 계정으로 바로 시작할 수 있어요</p>
              <div className="mt-6 flex gap-2">
                <Link href="/login" className={`${primaryButtonClass} h-10 px-5 text-[15px]`}>
                  로그인
                </Link>
                <Link href="/signup" className={`${secondaryButtonClass} h-10 px-5 text-[15px]`}>
                  회원가입
                </Link>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center text-center py-20">
              <div className={emptyIconTileClass}>
                <CalendarSearch className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-[15px] font-semibold text-gray-900">
                {filters.keyword
                  ? `'${filters.keyword}' 검색 결과가 없어요`
                  : hasAnyFilter
                    ? "조건에 맞는 모집이 없어요"
                    : "아직 등록된 모집이 없어요"}
              </p>
              <p className="mt-1 text-[13px] text-gray-600">
                {hasAnyFilter
                  ? "날짜나 지역을 바꿔서 다시 찾아보세요"
                  : "같이 뛸 용병을 가장 먼저 모집해 보세요"}
              </p>
              {hasAnyFilter ? (
                <button
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className={`${quietButtonClass} mt-6 h-10 px-5 text-[15px]`}
                >
                  필터 초기화
                </button>
              ) : (
                <Link
                  href={user ? "/create" : "/login"}
                  className={`${primaryButtonClass} mt-6 h-10 px-5 text-[15px]`}
                >
                  {user ? "첫 모집글 쓰기" : "로그인하고 모집하기"}
                </Link>
              )}
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.date} className="pt-5">
                <h2 className="text-[15px] font-semibold text-gray-900 tabular-nums">
                  {formatMatchDate(group.date)}
                </h2>
                <div>
                  {group.posts.map((post) => (
                    <RecruitCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            ))
          )}
          {!(authLoading || isLoading) && posts.length > 0 && loadingMore && (
            <div className="flex justify-center py-4">
              <div className={spinnerClass} role="status" aria-label="불러오는 중" />
            </div>
          )}
          {!(authLoading || isLoading) && !permissionDenied && hasMore && (
            <LoadMoreButton onClick={loadMore} label={hasAnyFilter ? "조건에 맞는 글 더 찾기" : "모집글 더 보기"} />
          )}
        </div>
      </main>

      {user && (
        <div className="md:hidden fixed inset-x-0 bottom-20 z-[45] pointer-events-none">
          <div className="max-w-2xl mx-auto px-4 flex justify-end">
            <Link
              href="/create"
              className={`${fabClass} pointer-events-auto`}
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              모집하기
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
