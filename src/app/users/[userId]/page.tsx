"use client";

import SubHeader from "@/src/components/SubHeader";
import { primaryButtonClass, spinnerClass } from "@/src/components/ui/styles";
import { useAuth } from "@/src/hooks/useAuth";
import { startChat } from "@/src/lib/services";
import { db } from "@/src/lib/firebase";
import { User } from "@/src/types";
import { doc, getDoc } from "firebase/firestore";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const targetUserId = params.userId as string;

  const { user: currentUser, userData, isLoading: authLoading } = useAuth();
  // user 객체 대신 uid로 의존해 같은 사용자의 토큰 갱신에는 다시 조회하지 않는다
  const currentUid = currentUser?.uid;
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);

  // 로그인하지 않은 사용자는 로그인 후 이 프로필로 돌아오도록 보낸다
  useEffect(() => {
    if (authLoading || currentUser) return;
    router.replace(`/login?next=${encodeURIComponent(`/users/${targetUserId}`)}`);
  }, [authLoading, currentUser, targetUserId, router]);

  // 로그인 확인 후에만 조회한다 (users 문서는 로그인 사용자만 읽을 수 있다)
  useEffect(() => {
    if (authLoading || !currentUid) return;

    let cancelled = false;

    const handleLoaded = (loaded: User | null) => {
      if (cancelled) return;
      setTargetUser(loaded);
    };

    const handleDone = () => {
      if (cancelled) return;
      setIsLoading(false);
    };

    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", targetUserId));
        handleLoaded(userDoc.exists() ? ({ uid: userDoc.id, ...userDoc.data() } as User) : null);
      } catch (e) {
        console.error("사용자 조회 에러:", e);
        handleLoaded(null);
      } finally {
        handleDone();
      }
    };
    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [targetUserId, currentUid, authLoading]);

  const handleStartChat = async () => {
    if (!currentUser || !targetUser) return;
    setStartingChat(true);
    try {
      const roomId = await startChat(
        // 보안 규칙이 채팅방의 내 이름을 users 문서 닉네임과 비교하므로 같은 출처를 쓴다
        // Auth 프로필 이름은 users 문서와 다를 수 있어 대체값으로 쓰지 않는다
        { uid: currentUser.uid, displayName: userData?.displayName || "사용자" },
        { uid: targetUser.uid, displayName: targetUser.displayName || "사용자" },
      );
      router.push(`/chat/${roomId}`);
    } catch (e) {
      console.error("채팅 시작 에러:", e);
      alert("채팅을 시작할 수 없습니다.");
    }
    setStartingChat(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={spinnerClass} role="status" aria-label="불러오는 중" />
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="text-[15px] font-semibold text-gray-900">사용자를 찾을 수 없어요</p>
        <Link href="/" className={`${primaryButtonClass} mt-5 h-10 px-5 text-sm`}>
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const isMe = currentUser?.uid === targetUser.uid;
  const showChatButton = !isMe && currentUser;

  return (
    <div className="min-h-screen bg-white">
      <SubHeader title="프로필" />

      <main className={`pt-14 ${showChatButton ? "pb-28" : "pb-12"} max-w-2xl mx-auto px-4`}>
        <section className="py-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-3xl font-bold">
              {targetUser.displayName?.charAt(0) || "U"}
            </span>
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">{targetUser.displayName}</h2>
          <p className="mt-1 text-[13px] text-gray-500">
            {targetUser.provider === "kakao" ? "카카오 회원" : "ChatFutsal 회원"}
          </p>
        </section>
      </main>

      {showChatButton && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <button
              onClick={handleStartChat}
              disabled={startingChat}
              className={`${primaryButtonClass} w-full h-12 text-[15px]`}
            >
              <MessageCircle className="w-5 h-5" />
              {startingChat ? "채팅방 여는 중..." : "채팅하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
