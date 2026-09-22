"use client";

import { useAuth } from "@/src/hooks/useAuth";
import {
  startChat,
  closeRecruitPost,
  deleteRecruitPost,
  reopenRecruitPost,
  applyToPost,
  cancelApplication,
} from "@/src/lib/services";
import { db } from "@/src/lib/firebase";
import { LEVEL_LABELS, RecruitPost } from "@/src/types";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AudioLines,
  Calendar,
  CopyMinus,
  CopyPlus,
  MapPin,
  PencilOff,
  Trash2,
  Users,
} from "lucide-react";
import KakaoMap from "@/src/components/KakaoMap";
import ApplicationModal from "@/src/components/ApplicationModal";
import ApplicationList from "@/src/components/ApplicationList";
import { usePostApplications } from "@/src/hooks/useApplications";
import { isPostExpired } from "@/src/lib/utils/dateUtils";

export default function RecruitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const { user, userData } = useAuth();
  const [post, setPost] = useState<RecruitPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const { applications } = usePostApplications(postId);

  // 실시간 게시글 불러오기
  useEffect(() => {
    const postRef = doc(db, "recruitPosts", postId);

    const unsubscribe = onSnapshot(postRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const postData = {
          id: snapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as RecruitPost;

        if (postData.status === "open" && isPostExpired(postData.date, postData.time)) {
          updateDoc(postRef, { status: "closed", updatedAt: serverTimestamp() }).catch(() => {});
          postData.status = "closed";
        }

        setPost(postData);
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
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleToggleStatus = async () => {
    if (!post) return;

    try {
      if (post.status === "open") {
        await closeRecruitPost(postId);
      } else {
        await reopenRecruitPost(postId);
      }
    } catch {
      alert("상태 변경에 실패했습니다.");
    }
  };

  const handleStartChat = async () => {
    if (!user || !userData || !post) return;

    if (user.uid === post.authorId) {
      alert("본인에게는 채팅을 보낼 수 없습니다.");
      return;
    }

    try {
      const roomId = await startChat(
        { uid: user.uid, displayName: userData.displayName || "사용자" },
        { uid: post.authorId, displayName: post.authorName },
      );

      router.push(`/chat/${roomId}`);
    } catch {
      alert("채팅 시작에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!post) {
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
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
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
                      <PencilOff className="w-4 h-4 inline mr-2" />
                      수정
                    </Link>
                    <button
                      onClick={handleToggleStatus}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50
                      hover:cursor-pointer"
                    >
                      {post.status === "open" ? (
                        <>
                          <CopyMinus className="w-4 h-4 inline mr-2" />
                          마감하기
                        </>
                      ) : (
                        <>
                          <CopyPlus className="w-4 h-4 inline mr-2" /> 재오픈
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-50 hover:cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4  inline mr-2" />
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <main className="pt-14 pb-24 px-4 overflow-hidden mx-auto w-full max-w-2xl">
        {/* 상태 배지 */}
        {post.status === "closed" && (
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
            {post.createdAt.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* 정보 카드 */}
        <div className="mt-6 bg-white rounded-2xl border-gray-100 p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">경기 일시</p>
              <p className="font-medium">
                {post.date} {post.time}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">장소</p>
              <p className="font-medium">{post.location}</p>
              {post.locationCoord?.address && (
                <p className="text-xs text-gray-400">
                  {post.locationCoord.address}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AudioLines className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">실력 수준</p>
              <p className="font-medium">{LEVEL_LABELS[post.level]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">모집 인원</p>
              <p className="font-medium">
                {post.acceptedCount || 0}/{post.needCount}명
              </p>
              <div className="mt-1.5 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(((post.acceptedCount || 0) / post.needCount) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        {/* 👇 지도 영역 추가 */}
        {post.locationCoord?.lat && post.locationCoord?.lng && (
          <div className="mt-4 bg-white rounded-2xl border-gray-100 p-4 shadow-sm">
            <h3 className="font-bold mb-3">구장 위치</h3>
            <KakaoMap
              lat={post.locationCoord.lat}
              lng={post.locationCoord.lng}
              address={post.location}
            />
          </div>
        )}

        {/* 상세 내용 */}
        {post.content && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              상세 내용
            </h3>
            <div className="bg-white rounded-2xl border-gray-100 p-4 shadow-sm">
              <p className="text-gray-700 whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          </div>
        )}

        {/* 신청 현황 (작성자에게만 표시) */}
        {isAuthor && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              신청 현황 ({applications.length}건)
            </h3>
            <div className="bg-white rounded-2xl border-gray-100 px-4 shadow-sm">
              <ApplicationList
                applications={applications}
                needCount={post.needCount}
                postId={postId}
              />
            </div>
          </div>
        )}
      </main>

      {/* 하단 버튼 (비작성자) */}
      {user && !isAuthor && post.status === "open" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={handleStartChat}
              className="flex-1 py-3 border border-green-600 text-green-600 font-bold rounded-lg hover:bg-green-50"
            >
              💬 채팅하기
            </button>
            {post.applicantIds?.includes(user.uid) ? (
              <button
                onClick={async () => {
                  const myApp = applications.find(
                    (a) => a.applicantId === user.uid && a.status === "pending",
                  );
                  if (myApp) {
                    const confirmed = window.confirm("신청을 취소하시겠습니까?");
                    if (!confirmed) return;
                    await cancelApplication(myApp.id, postId, user.uid);
                  } else {
                    alert("이미 처리된 신청입니다.");
                  }
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200"
              >
                신청 취소
              </button>
            ) : (
              <button
                onClick={() => setShowApplyModal(true)}
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
              >
                참가 신청
              </button>
            )}
          </div>
        </div>
      )}

      {/* 신청 모달 */}
      <ApplicationModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        postTitle={post.title}
        onSubmit={async (message) => {
          if (!user || !userData) return;
          await applyToPost(
            postId,
            post.title,
            user.uid,
            userData.displayName || "사용자",
            post.authorId,
            message,
          );
        }}
      />
    </div>
  );
}
