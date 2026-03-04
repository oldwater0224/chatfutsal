"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { startChat } from "@/src/lib/chatService";
import { db } from "@/src/lib/firebase";
import { closeRecruitPost, deleteRecruitPost, reopenRecruitPost } from "@/src/lib/recruitService";
import { RecruitPost } from "@/src/types";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "비기너",
  amateur: "아마추어",
  "semi-pro": "세미프로",
  pro: "프로",
};
export default function RecruitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const { user, userData } = useAuth();
  const [post, setPost] = useState<RecruitPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  // 실시간 게시글 불러오기
  useEffect(() => {
    const postRef = doc(db, "recruitPosts", postId);

    const unsubscribe = onSnapshot(postRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPost({
          id: snapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as RecruitPost);
      } else {
        setPost(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const isAuthor = user?.uid === post?.authorId;

  const handleDelete = async () => {
    const confirmed = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      await deleteRecruitPost(postId);
      router.push("/recruit");
    } catch (error) {
      alert("삭제에 실패했습니다.");
    }
  };


  const handleToggleStatus = async () => {
    if(!post) return;

    try{
      if(post.status === 'open'){
        await closeRecruitPost(postId);
      }else{
        await reopenRecruitPost(postId);
      }
    }catch(error){
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleStartChat = async () => {
    if(!user || !userData || !post) return;

    if(user.uid === post.authorId){
      alert('본인에게는 채팅을 보낼 수 없습니다.');
      return;
    }

    try{
      const roomId = await startChat(
        {uid : user.uid , displayName : userData.displayName || '사용자'} , 
        {uid : post.authorId , displayName : post.authorName} ,
      );

      router.push(`/chat/${roomId}`);
    }catch(error){
      alert('채팅 시작에 실패했습니다.')
    }
  };

   if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }
  if(!post){
    return (
       <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">게시글을 찾을 수 없습니다</p>
        <Link href="/recruit" className="text-green-600">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className=" mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/recruit" className="text-gray-600 text-xl">
              ←
            </Link>
            <h1 className="font-bold">용병 모집</h1>
          </div>

          {isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 flex items-center justify-center text-gray-500"
              >
                ⋮
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-10 bg-white border rounded-lg shadow-lg z-20 py-1 min-w-30">
                    <Link
                      href={`/recruit/${postId}/edit`}
                      className="block px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      ✏️ 수정
                    </Link>
                    <button
                      onClick={handleToggleStatus}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {post.status === 'open' ? '🔒 마감하기' : '🔓 재오픈'}
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-50"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <main className="pt-14 pb-24 px-4">
        {/* 상태 배지 */}
        {post.status === 'closed' && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
            <span className="text-gray-500 font-medium">모집 마감</span>
          </div>
        )}

        {/* 제목 */}
        <h2 className="mt-4 text-xl font-bold text-gray-900">{post.title}</h2>

        {/* 작성자 정보 */}
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <span>{post.authorName}</span>
          <span>·</span>
          <span>
            {post.createdAt.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* 정보 카드 */}
        <div className="mt-6 bg-white rounded-lg p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">📅</span>
            <div>
              <p className="text-sm text-gray-500">경기 일시</p>
              <p className="font-medium">
                {post.date} {post.time}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="text-sm text-gray-500">장소</p>
              <p className="font-medium">{post.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl">⚽</span>
            <div>
              <p className="text-sm text-gray-500">실력 수준</p>
              <p className="font-medium">{LEVEL_LABELS[post.level]}</p>
            </div>
          </div>

          

          
        </div>

        {/* 상세 내용 */}
        {post.content && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">상세 내용</h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
            </div>
          </div>
        )}
      </main>

      {/* 하단 채팅 버튼 */}
      {user && !isAuthor && post.status === 'open' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleStartChat}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              💬 채팅으로 연락하기
            </button>
          </div>
        </div>
      )}
    </div>
  )

}
