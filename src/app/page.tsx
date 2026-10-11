"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useRecruitPosts } from "@/src/hooks/useRecruitPosts";
import Header from "@/src/components/Header";
import BottomNav from "@/src/components/BottomNav";
import RecruitFilter, { FilterState } from "@/src/components/RecruitFilter";
import RecruitCard from "@/src/components/RecruitCard";
import SearchBar from "@/src/components/SearchBar";
import Link from "next/link";
import { CalendarSearch, Plus } from "lucide-react";
import { RecruitPost } from "@/src/types";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatSectionDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}월 ${d}일 (${DAY_NAMES[date.getDay()]})`;
}

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
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const { posts, isLoading } = useRecruitPosts(filters);
  const groups = useMemo(() => groupByDate(posts), [posts]);
  const hasAnyFilter = !!(filters.date || filters.region || filters.level || filters.keyword);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-14 pb-36">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-2">
          <h1 className="text-[22px] font-bold text-gray-900">용병 모집</h1>
          <div className="mt-3">
            <SearchBar
              value={filters.keyword}
              onChange={(keyword) => setFilters((prev) => ({ ...prev, keyword }))}
            />
          </div>
        </div>

        <RecruitFilter filters={filters} onFilterChange={setFilters} />

        <div className="max-w-2xl mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-7 h-7 border-[3px] border-green-100 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                <CalendarSearch className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-[15px] font-semibold text-gray-900">
                {filters.keyword
                  ? `'${filters.keyword}' 검색 결과가 없어요`
                  : hasAnyFilter
                    ? "조건에 맞는 모집이 없어요"
                    : "아직 등록된 모집이 없어요"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {hasAnyFilter
                  ? "날짜나 지역을 바꿔서 다시 찾아보세요"
                  : "같이 뛸 용병을 가장 먼저 모집해보세요"}
              </p>
              {hasAnyFilter ? (
                <button
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="mt-5 h-10 px-5 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 cursor-pointer"
                >
                  필터 초기화
                </button>
              ) : (
                <Link
                  href={user ? "/create" : "/login"}
                  className="mt-5 h-10 px-5 inline-flex items-center rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                >
                  {user ? "첫 모집글 쓰기" : "로그인하고 모집하기"}
                </Link>
              )}
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.date} className="pt-5">
                <h2 className="text-[15px] font-bold text-gray-900">
                  {formatSectionDate(group.date)}
                </h2>
                <div>
                  {group.posts.map((post) => (
                    <RecruitCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      {user && (
        <div className="fixed inset-x-0 bottom-20 z-[45] pointer-events-none">
          <div className="max-w-2xl mx-auto px-4 flex justify-end">
            <Link
              href="/create"
              className="pointer-events-auto h-12 pl-4 pr-5 inline-flex items-center gap-1.5 rounded-full bg-green-600 text-white text-sm font-semibold shadow-lg shadow-green-600/25 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              모집하기
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
