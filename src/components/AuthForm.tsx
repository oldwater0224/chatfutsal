'use client';

import Link from "next/link";
import { useState } from "react";

import { AuthFormProps } from "../types";
import Logo from "./Logo";
import { fieldInputClass, fieldLabelClass, primaryButtonClass } from "./ui/styles";

const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code`;

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await onSubmit(email, password, displayName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
        <div className="max-w-sm w-full space-y-7">
          <div className="flex flex-col items-center text-center">
            <Logo size="lg" />
            <p className="mt-3 text-sm text-gray-500">
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
                  className={fieldInputClass}
                  placeholder="풋살러1"
                />
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
              <p className="text-red-500 text-[13px] text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`${primaryButtonClass} w-full h-12 text-[15px] mt-2`}
            >
              {isLoading
                ? "처리 중..."
                : mode === "login"
                  ? "로그인"
                  : "회원가입"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">또는</span>
            </div>
          </div>

          <a
            href={KAKAO_AUTH_URL}
            className="w-full h-12 flex items-center justify-center gap-2 px-4 rounded-xl text-[15px] font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FEE500", color: "rgba(0,0,0,0.85)" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9 0.6C4.029 0.6 0 3.713 0 7.554c0 2.467 1.644 4.636 4.114 5.867l-1.05 3.848c-.093.34.297.607.586.4l4.514-2.987c.276.02.556.03.836.03 4.971 0 9-3.112 9-6.958C18 3.713 13.971 0.6 9 0.6"
                fill="black"
              />
            </svg>
            카카오로 시작하기
          </a>

          <p className="text-center text-sm text-gray-600">
            {mode === "login" ? (
              <>
                계정이 없으신가요?{" "}
                <Link
                  href="/signup"
                  className="text-green-600 hover:text-green-500 font-medium"
                >
                  회원가입
                </Link>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{" "}
                <Link
                  href="/login"
                  className="text-green-600 hover:text-green-500 font-medium"
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
