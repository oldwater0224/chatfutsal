"use client";

import BottomNav from "@/src/components/BottomNav";
import SubHeader from "@/src/components/SubHeader";
import SeatDots from "@/src/components/SeatDots";
import {
  emptyIconTileClass,
  focusRingInsetClass,
  primaryButtonClass,
  spinnerClass,
} from "@/src/components/ui/styles";
import { useAuth } from "@/src/hooks/useAuth";
import { useMyRecruitPosts } from "@/src/hooks/useRecruitPosts";
import { formatMatchDate } from "@/src/lib/utils/dateUtils";
import { LEVEL_LABELS, RecruitPost } from "@/src/types";
import { ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function MyPostRow({ post }: { post: RecruitPost }) {
  const isClosed = post.status === "closed";
  const accepted = post.acceptedCount || 0;
  return (
    <Link
      href={`/recruit/${post.id}`}
      className={`-mx-4 px-4 py-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${focusRingInsetClass} ${
        isClosed ? "opacity-50" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-medium text-gray-900 truncate">{post.title}</h3>
        <p className="mt-1 text-[13px] text-gray-600 truncate">
          <span className="tabular-nums">
            {formatMatchDate(post.date)} {post.time}
          </span>{" "}
          · {post.location}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <SeatDots filled={accepted} total={post.needCount} closed={isClosed} />
          <span className="tabular-nums">
            {accepted}/{post.needCount}명
          </span>
          <span aria-hidden="true">·</span>
          <span>{LEVEL_LABELS[post.level]}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0 text-gray-400" aria-hidden="true" />
    </Link>
  );
}

function Section({ title, posts }: { title: string; posts: RecruitPost[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="pt-5">
      <h2 className="text-[15px] font-semibold text-gray-900">
        {title} <span className="text-gray-500 tabular-nums">{posts.length}</span>
      </h2>
      <div>
        {posts.map((post) => (
          <MyPostRow key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

export default function MypageRecruit() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { posts, isLoading: postsLoading } = useMyRecruitPosts(user?.uid);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, router, user]);

  if (!authLoading && !user) return null;

  const openPosts = posts.filter((p) => p.status === "open");
  const closedPosts = posts.filter((p) => p.status === "closed");

  return (
    <div className="min-h-screen bg-white">
      <SubHeader title="내가 작성한 모집글" backHref="/mypage" />

      <main className="pt-14 pb-24 max-w-2xl mx-auto px-4">
        {authLoading || postsLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className={spinnerClass} role="status" aria-label="불러오는 중" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20">
            <div className={emptyIconTileClass}>
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="text-[15px] font-semibold text-gray-900">작성한 모집글이 없어요</p>
            <p className="mt-1 text-[13px] text-gray-600">함께 뛸 용병을 모집해 보세요</p>
            <Link href="/create" className={`${primaryButtonClass} mt-6 h-10 px-5 text-[15px]`}>
              모집글 쓰기
            </Link>
          </div>
        ) : (
          <>
            <Section title="모집 중" posts={openPosts} />
            <Section title="마감" posts={closedPosts} />
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
