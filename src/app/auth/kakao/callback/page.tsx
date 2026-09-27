"use client";

import { auth } from "@/src/lib/firebase";
import { signInWithCustomToken } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const processedCodes = new Set<string>();

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
          throw new Error(data.error || "로그인 실패");
        }

        await signInWithCustomToken(auth, data.token);
        router.push("/");
      } catch (e) {
        setError(e instanceof Error ? e.message : "로그인 처리 중 오류 발생");
      }
    },
    [router],
  );

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("카카오 로그인이 취소되었습니다");
      return;
    }

    if (!code) {
      setError("인가 코드가 없습니다");
      return;
    }

    if (processedCodes.has(code)) return;
    processedCodes.add(code);

    processLogin(code);
  }, [searchParams, processLogin]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => router.push("/login")}
          className="text-green-600 font-medium"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin mx-auto" />
        <p className="text-gray-500">카카오 로그인 처리 중...</p>
      </div>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin" />
        </div>
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  );
}
