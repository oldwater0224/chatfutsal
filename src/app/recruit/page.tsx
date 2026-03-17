'use client'

import BottomNav from "@/src/components/BottomNav";
import Header from "@/src/components/Header";
import { useAuth } from "@/src/hooks/useAuth";
import { useRecruitPosts } from "@/src/hooks/useRecruitPosts";
import Link from "next/link";


const LEVEL_LABELS: Record<string , string> = {
  beginner : '비기너' ,
  amateur : '아마추어' , 
  semipro : '세미프로' , 
  pro: '프로'
};
const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  amateur: 'bg-blue-100 text-blue-700',
  semipro: 'bg-purple-100 text-purple-700',
  pro: 'bg-red-100 text-red-700',
};

export default function RecruitListPage(){
  const {user} = useAuth();
  const {posts , isLoading} = useRecruitPosts();

  return (
     <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-14 pb-20">
        {/* 페이지 헤더 */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">용병 모집</h1>
          {user && (
            <Link
              href="/recruit/create"
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700"
            >
              <span>+</span>
              <span>글쓰기</span>
            </Link>
          )}
        </div>

        {/* 게시글 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            
            <p className="text-gray-700 font-medium mb-1">모집 글이 없어요</p>
            <p className="text-gray-500 text-sm mb-4">
              첫 번째 용병 모집 글을 작성해보세요!
            </p>
            {user && (
              <Link
                href="/recruit/create"
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                글쓰기
              </Link>
            )}
          </div>
        ) : (
          <div>
            {posts.map((post) => (
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
                    <p>
                      📅 {post.date} {post.time}
                    </p>
                    <p>📍 {post.location}</p>
                   
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>{post.authorName}</span>
                    <span>
                      {post.createdAt.toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

