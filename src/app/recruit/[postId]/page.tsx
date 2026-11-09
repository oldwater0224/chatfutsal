"use client";

import { useAuth } from "@/src/hooks/useAuth";
import {
  startChat,
  getDisplayName,
  closeRecruitPostWithApplications,
  deleteRecruitPost,
  reopenRecruitPost,
  applyToPost,
  cancelApplication,
  ApplicationError,
  closePendingApplications,
  hasUnclearedPendingApplications,
} from "@/src/lib/services";
import { db } from "@/src/lib/firebase";
import { LEVEL_COLORS, LEVEL_LABELS, RecruitPost } from "@/src/types";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  type DocumentSnapshot,
  type FirestoreError,
} from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import SubHeader from "@/src/components/SubHeader";
import {
  avatarClass,
  badgeClass,
  dangerMenuItemClass,
  focusRingClass,
  iconButtonClass,
  menuItemClass,
  primaryButtonClass,
  quietButtonClass,
  secondaryButtonClass,
  spinnerClass,
} from "@/src/components/ui/styles";
import SeatDots from "@/src/components/SeatDots";
import KakaoMap from "@/src/components/KakaoMap";
import ApplicationModal from "@/src/components/ApplicationModal";
import ApplicationList from "@/src/components/ApplicationList";
import { usePostApplications } from "@/src/hooks/useApplications";
import { formatMatchDate, isPostExpired } from "@/src/lib/utils/dateUtils";

export default function RecruitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const { user, userData, isLoading: authLoading } = useAuth();
  // user 객체 대신 uid로 의존해 같은 사용자의 토큰 갱신에는 다시 구독하지 않는다
  const uid = user?.uid;
  const [post, setPost] = useState<RecruitPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // 값이 바뀌면 게시글 구독을 다시 연다 ("다시 시도" 버튼용)
  const [retryKey, setRetryKey] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  // 비로그인 상태에서는 보안 규칙에 막히므로 구독하지 않는다
  const { applications } = usePostApplications(user ? postId : undefined);
  // 대기 신청 정리를 세션당 한 번만 시도하기 위한 기록
  const cleanupAttemptedRef = useRef(false);

  // 로그인하지 않은 사용자는 로그인 후 이 글로 돌아오도록 보낸다
  useEffect(() => {
    if (authLoading || user) return;
    router.replace(`/login?next=${encodeURIComponent(`/recruit/${postId}`)}`);
  }, [authLoading, user, postId, router]);

  // 실시간 게시글 불러오기 (로그인 확인 후에만 구독한다)
  useEffect(() => {
    if (authLoading || !uid) return;

    const postRef = doc(db, "recruitPosts", postId);

    const handleSnapshot = (snapshot: DocumentSnapshot) => {
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
      setLoadError(null);
      setIsLoading(false);
    };

    const handleError = (error: FirestoreError) => {
      console.error("게시글 구독 에러:", error);
      setLoadError("게시글을 불러오지 못했어요");
      setIsLoading(false);
    };

    const unsubscribe = onSnapshot(postRef, handleSnapshot, handleError);

    return () => unsubscribe();
  }, [postId, uid, authLoading, retryKey]);

  const handleRetry = () => {
    setLoadError(null);
    setIsLoading(true);
    setRetryKey((k) => k + 1);
  };

  const isAuthor = user?.uid === post?.authorId;

  // 경기 시간 경과로 자동 마감된 글은, 마감을 수행한 사용자에게 남의 신청을 바꿀 권한이 없어
  // 대기 신청이 그대로 남는다. 권한이 있는 작성자가 글을 열 때 뒤늦게 정리한다.
  // 쓰기만 하는 effect이므로 setState는 하지 않고, 세션당 글마다 한 번만 시도한다.
  useEffect(() => {
    if (!isAuthor || !post || cleanupAttemptedRef.current) return;
    if (!hasUnclearedPendingApplications(post)) return;

    cleanupAttemptedRef.current = true;
    closePendingApplications(post.id, post.title).catch(() => {});
  }, [isAuthor, post]);

  const handleDelete = async () => {
    const hasApplicants = applications.some(
      (a) => a.status === "pending" || a.status === "accepted",
    );
    const confirmed = window.confirm(
      hasApplicants
        ? "이 모집글을 삭제할까요?\n신청자에게 모집 취소 알림이 가요"
        : "이 모집글을 삭제할까요?",
    );
    if (!confirmed) return;

    try {
      await deleteRecruitPost(postId, post?.title ?? "");
      router.push("/");
    } catch {
      alert("삭제하지 못했어요");
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
            `대기 중인 신청 ${pendingCount}건은 마감 처리되고 신청자에게 알림이 가요.\n마감할까요?`,
          )
        ) {
          return;
        }
        await closeRecruitPostWithApplications(postId, post.title);
      } else {
        await reopenRecruitPost(postId);
      }
    } catch (e) {
      alert(e instanceof ApplicationError ? e.message : "모집 상태를 바꾸지 못했어요");
    }
  };

  const handleStartChat = async () => {
    if (!user || !userData || !post) return;

    if (user.uid === post.authorId) {
      alert("내 글에는 채팅을 보낼 수 없어요");
      return;
    }

    try {
      // authorName은 글 작성 시점 이름이라, 새 채팅방에는 작성자의 현재 닉네임을 넣는다
      // 조회에 실패하면 보안 규칙이 허용하는 기본값 "사용자"를 쓴다 (옛 이름은 users 문서와 달라 거부된다)
      const authorName = (await getDisplayName(post.authorId).catch(() => null)) || "사용자";
      const roomId = await startChat(
        { uid: user.uid, displayName: userData.displayName || "사용자" },
        { uid: post.authorId, displayName: authorName },
      );

      router.push(`/chat/${roomId}`);
    } catch {
      alert("채팅을 시작하지 못했어요");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={spinnerClass} role="status" aria-label="불러오는 중" />
      </div>
    );
  }
  if (loadError) {
    return (
      <div
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      >
        <p className="text-[15px] font-semibold text-gray-900">{loadError}</p>
        <p className="mt-1 text-[13px] text-gray-600">잠시 후 다시 시도해 주세요</p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className={`${primaryButtonClass} h-10 px-5 text-[15px]`}
          >
            다시 시도
          </button>
          <Link href="/" className={`${secondaryButtonClass} h-10 px-5 text-[15px]`}>
            목록으로
          </Link>
        </div>
      </div>
    );
  }
  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="text-[15px] font-semibold text-gray-900">게시글을 찾을 수 없어요</p>
        <p className="mt-1 text-[13px] text-gray-600">삭제되었거나 주소가 잘못되었어요</p>
        <Link href="/" className={`${primaryButtonClass} mt-6 h-10 px-5 text-[15px]`}>
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
                aria-haspopup="menu"
                aria-expanded={showMenu}
                className={`-mr-2 ${iconButtonClass}`}
              >
                <MoreVertical className="w-5 h-5" aria-hidden="true" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div role="menu" className="absolute right-0 top-12 z-20 min-w-36 py-1 bg-white border border-gray-100 rounded-xl shadow-lg">
                    <Link
                      href={`/recruit/${postId}/edit`}
                      role="menuitem"
                      className={menuItemClass}
                    >
                      <PencilLine className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      수정
                    </Link>
                    <button
                      onClick={handleToggleStatus}
                      role="menuitem"
                      className={menuItemClass}
                    >
                      {post.status === "open" ? (
                        <>
                          <CopyMinus className="w-4 h-4 text-gray-500" aria-hidden="true" />
                          마감하기
                        </>
                      ) : (
                        <>
                          <CopyPlus className="w-4 h-4 text-gray-500" aria-hidden="true" />
                          다시 모집하기
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDelete}
                      role="menuitem"
                      className={dangerMenuItemClass}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
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
          <div className="flex items-center gap-2">
            <span className={`${badgeClass} ${LEVEL_COLORS[post.level]}`}>
              {LEVEL_LABELS[post.level]}
            </span>
            <span
              className={`${badgeClass} tabular-nums ${
                isClosed
                  ? "bg-gray-100 text-gray-500"
                  : remaining <= 1
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-700"
              }`}
            >
              {isClosed ? "모집 마감" : remaining <= 1 ? "마감임박" : `${remaining}자리 남음`}
            </span>
          </div>
          <h2 className="mt-4 text-[22px] font-semibold text-gray-900 leading-snug">{post.title}</h2>
          <Link
            href={`/users/${post.authorId}`}
            className={`mt-4 inline-flex items-center gap-2 rounded-lg text-[13px] text-gray-600 hover:text-gray-900 transition-colors ${focusRingClass}`}
          >
            <span className={`w-6 h-6 text-xs ${avatarClass}`} aria-hidden="true">
              {post.authorName?.charAt(0)}
            </span>
            {post.authorName}
          </Link>
        </section>

        <div className="-mx-4 h-2 bg-gray-50" />

        <section className="py-5 space-y-4">
          <InfoRow icon={Calendar} label="경기 일시">
            <span className="tabular-nums">
              {formatMatchDate(post.date)} {post.time}
            </span>
          </InfoRow>
          <InfoRow icon={MapPin} label="장소">
            {post.location}
            {post.locationCoord?.address && (
              <span className="block mt-1 text-[13px] font-normal text-gray-600">
                {post.locationCoord.address}
              </span>
            )}
          </InfoRow>
          <InfoRow icon={AudioLines} label="실력 수준">
            {LEVEL_LABELS[post.level]}
          </InfoRow>
          <InfoRow icon={Users} label="모집 인원">
            <span className="tabular-nums">
              {accepted}/{post.needCount}명
              {!isClosed && remaining > 0 && (
                <span className="ml-2 font-medium text-green-700">{remaining}자리 남음</span>
              )}
            </span>
            <span className="mt-2 block">
              <SeatDots filled={accepted} total={post.needCount} size="md" closed={isClosed} />
            </span>
          </InfoRow>

          {post.locationCoord?.lat && post.locationCoord?.lng && (
            <div>
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
              <h3 className="text-[15px] font-semibold text-gray-900">상세 내용</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-900 whitespace-pre-wrap">
                {post.content}
              </p>
            </section>
          </>
        )}

        {isAuthor && (
          <>
            <div className="-mx-4 h-2 bg-gray-50" />
            <section className="py-5">
              <h3 className="text-[15px] font-semibold text-gray-900">
                신청 현황 <span className="text-gray-500 tabular-nums">{applications.length}</span>
              </h3>
              <div className="mt-2">
                <ApplicationList
                  applications={applications}
                  postId={postId}
                  postStatus={post.status}
                />
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
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
              채팅
            </button>
            {post.applicantIds?.includes(user.uid) ? (
              <button
                onClick={async () => {
                  const myApp = applications.find(
                    (a) => a.applicantId === user.uid && a.status === "pending",
                  );
                  if (myApp) {
                    const confirmed = window.confirm("신청을 취소할까요?");
                    if (!confirmed) return;
                    try {
                      await cancelApplication(myApp.id, postId, user.uid);
                    } catch (e) {
                      alert(e instanceof ApplicationError ? e.message : "신청을 취소하지 못했어요");
                    }
                  } else {
                    alert("이미 처리된 신청이에요");
                  }
                }}
                className={`${quietButtonClass} flex-1 h-12 text-[15px]`}
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
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 shrink-0 text-gray-500" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-5 text-gray-600">{label}</p>
        <div className="mt-1 text-[15px] font-medium text-gray-900">{children}</div>
      </div>
    </div>
  );
}
