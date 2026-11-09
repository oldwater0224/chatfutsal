'use client';

import Link from "next/link";
import { useState } from "react";

import { DISPLAY_NAME_MAX, DISPLAY_NAME_MIN, validateDisplayName } from "../lib/services/userRules";
import { AuthFormProps } from "../types";
import Logo from "./Logo";
import { fieldInputClass, fieldLabelClass, focusRingClass, primaryButtonClass } from "./ui/styles";

// 카카오 로그인은 외부로 나갔다 돌아오므로, 돌아갈 경로를 콜백 페이지가 읽도록 잠시 보관한다
export const LOGIN_NEXT_STORAGE_KEY = "chatfutsal:loginNext";

const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code`;

type Props = AuthFormProps & {
  /** 로그인·가입 후 돌아갈 경로 (?next= 값). 검증은 사용하는 쪽에서 resolveNextPath로 한다 */
  next?: string | null;
};

export default function AuthForm({ mode, onSubmit, next }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // 입력을 마치거나 제출을 시도한 뒤에만 닉네임 오류를 보여준다
  const [nameTouched, setNameTouched] = useState(false);

  const isSignup = mode === "signup";
  const nameCheck = isSignup ? validateDisplayName(displayName) : null;
  const nameError = nameCheck && !nameCheck.ok && nameCheck.reason === "invalid" ? nameCheck.message : "";
  const showNameError = nameTouched && !!nameError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup && nameError) {
      setNameTouched(true);
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      await onSubmit(email, password, nameCheck?.ok ? nameCheck.value : displayName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 생겼어요");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoClick = () => {
    try {
      if (next) sessionStorage.setItem(LOGIN_NEXT_STORAGE_KEY, next);
      else sessionStorage.removeItem(LOGIN_NEXT_STORAGE_KEY);
    } catch {
      // 저장소를 쓸 수 없으면 로그인 후 홈으로 간다
    }
  };

  // 로그인·회원가입 화면을 오가도 돌아갈 경로를 유지한다
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
        <div className="max-w-sm w-full space-y-8">
          <div className="flex flex-col items-center text-center">
            <Logo size="lg" />
            <p className="mt-4 text-[15px] text-gray-600">
              {mode === "login"
                ? "풋살 용병 모집부터 채팅까지 한 곳에서"
                : "가입하고 함께 뛸 용병을 찾아보세요"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="displayName"
                  className={fieldLabelClass}
                >
                  닉네임
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  className={fieldInputClass}
                  placeholder="풋살러1"
                  autoComplete="nickname"
                  aria-invalid={showNameError}
                  aria-describedby="displayName-help"
                />
                <p
                  id="displayName-help"
                  className={`mt-2 text-[13px] tabular-nums ${showNameError ? "text-red-600" : "text-gray-500"}`}
                >
                  {showNameError ? nameError : `${DISPLAY_NAME_MIN}~${DISPLAY_NAME_MAX}자`}
                </p>
              </div>
            )}
            {/* email */}
            <div>
              <label
                htmlFor="email"
                className={fieldLabelClass}
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldInputClass}
                placeholder="example@email.com"
              />
            </div>
            {/* password */}
            <div>
              <label
                htmlFor="password"
                className={fieldLabelClass}
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldInputClass}
                placeholder="6자 이상 입력"
              />
            </div>

            {error && (
              <p role="alert" className="text-red-600 text-[13px] text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || showNameError}
              className={`${primaryButtonClass} w-full h-12 text-[15px] mt-2`}
            >
              {isLoading
                ? "처리 중"
                : mode === "login"
                  ? "로그인"
                  : "회원가입"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-[13px]">
              <span className="px-3 bg-white text-gray-500">또는</span>
            </div>
          </div>

          <a
            href={KAKAO_AUTH_URL}
            onClick={handleKakaoClick}
            className={`w-full h-12 flex items-center justify-center gap-2 px-4 rounded-lg text-[15px] font-semibold transition-opacity hover:opacity-90 ${focusRingClass}`}
            style={{ backgroundColor: "#FEE500", color: "rgba(0,0,0,0.85)" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9 0.6C4.029 0.6 0 3.713 0 7.554c0 2.467 1.644 4.636 4.114 5.867l-1.05 3.848c-.093.34.297.607.586.4l4.514-2.987c.276.02.556.03.836.03 4.971 0 9-3.112 9-6.958C18 3.713 13.971 0.6 9 0.6"
                fill="black"
              />
            </svg>
            카카오로 시작하기
          </a>

          <p className="text-center text-[13px] text-gray-600">
            {mode === "login" ? (
              <>
                계정이 없으신가요?{" "}
                <Link
                  href={`/signup${nextQuery}`}
                  className={`text-green-700 hover:underline font-medium rounded-sm ${focusRingClass}`}
                >
                  회원가입
                </Link>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{" "}
                <Link
                  href={`/login${nextQuery}`}
                  className={`text-green-700 hover:underline font-medium rounded-sm ${focusRingClass}`}
                >
                  로그인
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
