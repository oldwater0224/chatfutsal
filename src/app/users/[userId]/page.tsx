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

  const { user: currentUser, userData } = useAuth();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, "users", targetUserId));
      if (userDoc.exists()) {
        setTargetUser({ uid: userDoc.id, ...userDoc.data() } as User);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [targetUserId]);

  const handleStartChat = async () => {
    if (!currentUser || !targetUser) return;
    setStartingChat(true);
    try {
      const roomId = await startChat(
        // 보안 규칙이 채팅방의 내 이름을 users 문서 닉네임과 비교하므로 같은 출처를 쓴다
        { uid: currentUser.uid, displayName: userData?.displayName || currentUser.displayName || "사용자" },
        { uid: targetUser.uid, displayName: targetUser.displayName },
      );
      router.push(`/chat/${roomId}`);
    } catch (e) {
      console.error("채팅 시작 에러:", e);
      alert("채팅을 시작할 수 없습니다.");
    }
    setStartingChat(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={spinnerClass} />
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
