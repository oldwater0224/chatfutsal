"use client";

import { auth, db } from "@/src/lib/firebase";
import { validateDisplayName } from "@/src/lib/services/userRules";
import { resolveNextPath } from "@/src/lib/utils/internalLink";
import { LOGIN_NEXT_STORAGE_KEY } from "@/src/components/AuthForm";
import { kakaoSpinnerClass, secondaryButtonClass } from "@/src/components/ui/styles";
import { signInWithCustomToken } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const processedCodes = new Set<string>();

// 카카오로 떠나기 전에 AuthForm이 보관한 돌아갈 경로를 꺼내고 지운다
function takeStoredNext(): string | null {
  try {
    const stored = sessionStorage.getItem(LOGIN_NEXT_STORAGE_KEY);
    sessionStorage.removeItem(LOGIN_NEXT_STORAGE_KEY);
    return stored;
  } catch {
    return null;
  }
}

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  const processLogin = useCallback(
    async (code: string) => {
      try {
        const res = await fetch("/api/auth/kakao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "로그인하지 못했어요");
        }

        await signInWithCustomToken(auth, data.token);

        const userRef = doc(db, "users", data.user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // 카카오 닉네임이 닉네임 규칙(2~12자 등)에 맞지 않으면 기본값으로 가입시킨다
          const nameCheck = validateDisplayName(data.user.nickname ?? "");
          await setDoc(userRef, {
            uid: data.user.uid,
            email: null,
            displayName: nameCheck.ok ? nameCheck.value : "사용자",
            provider: "kakao",
            profileImage: data.user.profileImage,
            createdAt: serverTimestamp(),
          });
        }

        router.replace(resolveNextPath(takeStoredNext()));
      } catch (e) {
        setError(e instanceof Error ? e.message : "로그인 중 오류가 생겼어요");
      }
    },
    [router],
  );

  const code = searchParams.get("code");
  // 주소만 보고 알 수 있는 오류는 effect에서 상태로 옮기지 않고 렌더링 중에 계산한다
  const paramError = searchParams.get("error")
    ? "카카오 로그인을 취소했어요"
    : !code
      ? "인가 코드가 없어요"
      : "";

  useEffect(() => {
    if (paramError || !code) return;
    if (processedCodes.has(code)) return;
    processedCodes.add(code);

    processLogin(code);
  }, [code, paramError, processLogin]);

  const shownError = paramError || error;

  if (shownError) {
    return (
      <div role="alert" className="min-h-screen flex flex-col items-center justify-center text-center gap-6 px-4">
        <p className="text-[15px] text-red-600">{shownError}</p>
        <button
          onClick={() => router.push("/login")}
          className={`${secondaryButtonClass} h-10 px-5 text-[15px]`}
        >
          로그인 화면으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div role="status" className="flex flex-col items-center gap-4">
        <div className={kakaoSpinnerClass} aria-hidden="true" />
        <p className="text-[15px] text-gray-600">카카오 로그인 중</p>
      </div>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className={kakaoSpinnerClass} role="status" aria-label="불러오는 중" />
        </div>
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  );
}
