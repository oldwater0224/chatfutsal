"use client";

import { useAuth } from "@/src/hooks/useAuth";
import {
  startChat,
  closeRecruitPostWithApplications,
  deleteRecruitPost,
  reopenRecruitPost,
  applyToPost,
  cancelApplication,
  ApplicationError,
} from "@/src/lib/services";
import { db } from "@/src/lib/firebase";
import { LEVEL_COLORS, LEVEL_LABELS, RecruitPost } from "@/src/types";
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
  MessageCircle,
  MoreVertical,
  PencilLine,
  Trash2,
  Users,
} from "lucide-react";
import SubHeader from "@/src/components/SubHeader";
import { primaryButtonClass, secondaryButtonClass, spinnerClass } from "@/src/components/ui/styles";
import KakaoMap from "@/src/components/KakaoMap";
import ApplicationModal from "@/src/components/ApplicationModal";
import ApplicationList from "@/src/components/ApplicationList";
import { usePostApplications } from "@/src/hooks/useApplications";
import { formatMatchDate, isPostExpired } from "@/src/lib/utils/dateUtils";

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
    const hasApplicants = applications.some(
      (a) => a.status === "pending" || a.status === "accepted",
    );
    const confirmed = window.confirm(
      hasApplicants
        ? "정말 삭제하시겠습니까?\n신청자에게 모집 취소 알림이 전송됩니다."
        : "정말 삭제하시겠습니까?",
    );
    if (!confirmed) return;

    try {
      await deleteRecruitPost(postId, post?.title ?? "");
      router.push("/");
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleToggleStatus = async () => {
    if (!post) return;

    try {
      if (post.status === "open") {
        const pendingCount = applications.filter((a) => a.status === "pending").length;
        if (
          pendingCount > 0 &&
          !window.confirm(
            `대기 중인 신청 ${pendingCount}건은 모집 마감 처리되고 신청자에게 알림이 전송됩니다.\n마감하시겠습니까?`,
          )
        ) {
          return;
        }
        await closeRecruitPostWithApplications(postId, post.title);
      } else {
        await reopenRecruitPost(postId);
      }
    } catch (e) {
      alert(e instanceof ApplicationError ? e.message : "상태 변경에 실패했습니다.");
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
        <div className={spinnerClass} />
      </div>
    );
  }
  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="text-[15px] font-semibold text-gray-900">게시글을 찾을 수 없어요</p>
        <p className="mt-1 text-sm text-gray-500">삭제되었거나 주소가 잘못되었어요</p>
        <Link href="/" className={`${primaryButtonClass} mt-5 h-10 px-5 text-sm`}>
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const isClosed = post.status === "closed";
  const accepted = post.acceptedCount || 0;
  const remaining = Math.max(post.needCount - accepted, 0);
  const showActionBar = user && !isAuthor && !isClosed;

  return (
    <div className="min-h-screen bg-white">
      <SubHeader
        title="모집 상세"
        backHref="/"
        right={
          isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label="게시글 메뉴"
                className="-mr-2 w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-11 z-20 min-w-36 py-1 bg-white border border-gray-100 rounded-xl shadow-lg">
                    <Link
                      href={`/recruit/${postId}/edit`}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <PencilLine className="w-4 h-4" />
                      수정
                    </Link>
                    <button
                      onClick={handleToggleStatus}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      {post.status === "open" ? (
                        <>
                          <CopyMinus className="w-4 h-4" />
                          마감하기
                        </>
                      ) : (
                        <>
                          <CopyPlus className="w-4 h-4" />
                          다시 모집하기
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-gray-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        }
      />

      <main className={`pt-14 ${showActionBar ? "pb-28" : "pb-12"} max-w-2xl mx-auto px-4`}>
        <section className="pt-5 pb-6">
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${LEVEL_COLORS[post.level]}`}>
              {LEVEL_LABELS[post.level]}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                isClosed
                  ? "bg-gray-100 text-gray-500"
                  : remaining <= 1
                    ? "bg-red-50 text-red-500"
                    : "bg-green-50 text-green-700"
              }`}
            >
              {isClosed ? "모집 마감" : remaining <= 1 ? "마감임박" : `${remaining}자리 남음`}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-bold text-gray-900 leading-snug">{post.title}</h2>
          <Link
            href={`/users/${post.authorId}`}
            className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[11px] font-semibold text-green-600">
              {post.authorName?.charAt(0)}
            </span>
            {post.authorName}
          </Link>
        </section>

        <div className="-mx-4 h-2 bg-gray-50" />

        <section className="py-5 space-y-4">
          <InfoRow icon={<Calendar className="w-5 h-5 text-blue-500" />} label="경기 일시">
            {formatMatchDate(post.date)} {post.time}
          </InfoRow>
          <InfoRow icon={<MapPin className="w-5 h-5 text-red-500" />} label="장소">
            {post.location}
            {post.locationCoord?.address && (
              <span className="block text-[13px] font-normal text-gray-400">
                {post.locationCoord.address}
              </span>
            )}
          </InfoRow>
          <InfoRow icon={<AudioLines className="w-5 h-5 text-purple-500" />} label="실력 수준">
            {LEVEL_LABELS[post.level]}
          </InfoRow>
          <InfoRow icon={<Users className="w-5 h-5 text-green-600" />} label="모집 인원">
            {accepted}/{post.needCount}명
            <span className="mt-2 block h-1.5 w-full max-w-60 bg-gray-100 rounded-full overflow-hidden">
              <span
                className="block h-full bg-green-600 rounded-full transition-all"
                style={{ width: `${Math.min((accepted / post.needCount) * 100, 100)}%` }}
              />
            </span>
          </InfoRow>

          {post.locationCoord?.lat && post.locationCoord?.lng && (
            <div className="pt-1">
              <KakaoMap
                lat={post.locationCoord.lat}
                lng={post.locationCoord.lng}
                address={post.location}
              />
            </div>
          )}
        </section>

        {post.content && (
          <>
            <div className="-mx-4 h-2 bg-gray-50" />
            <section className="py-5">
              <h3 className="text-[15px] font-bold text-gray-900">상세 내용</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-700 whitespace-pre-wrap">
                {post.content}
              </p>
            </section>
          </>
        )}

        {isAuthor && (
          <>
            <div className="-mx-4 h-2 bg-gray-50" />
            <section className="py-5">
              <h3 className="text-[15px] font-bold text-gray-900">
                신청 현황 <span className="text-green-600">{applications.length}</span>
              </h3>
              <div className="mt-2">
                <ApplicationList applications={applications} postId={postId} />
              </div>
            </section>
          </>
        )}
      </main>

      {showActionBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
            <button
              onClick={handleStartChat}
              className={`${secondaryButtonClass} h-12 px-5 text-[15px]`}
            >
              <MessageCircle className="w-5 h-5" />
              채팅
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
                    try {
                      await cancelApplication(myApp.id, postId, user.uid);
                    } catch (e) {
                      alert(e instanceof ApplicationError ? e.message : "취소에 실패했습니다.");
                    }
                  } else {
                    alert("이미 처리된 신청입니다.");
                  }
                }}
                className="flex-1 h-12 rounded-xl bg-gray-100 text-[15px] font-semibold text-gray-600 hover:bg-gray-200 cursor-pointer"
              >
                신청 취소
              </button>
            ) : (
              <button
                onClick={() => setShowApplyModal(true)}
                className={`${primaryButtonClass} flex-1 h-12 text-[15px]`}
              >
                참가 신청하기
              </button>
            )}
          </div>
        </div>
      )}

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

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-gray-500">{label}</p>
        <div className="mt-0.5 text-[15px] font-semibold text-gray-900">{children}</div>
      </div>
    </div>
  );
}
