'use client';

import Link from "next/link";
import { useState } from "react";

import { AuthFormProps } from "../types";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-center text-gray-900">
              ChatFutsaL
            </h1>
            <h2 className="mt-2 text-center text-gray-600">
              {mode === "login" ? "로그인" : "회원가입"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-700"
                >
                  닉네임
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="풋살러1"
                />
              </div>
            )}
            {/* email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="example@email.com"
              />
            </div>
            {/* password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="6자 이상 입력"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">또는</span>
            </div>
          </div>

          <a
            href={KAKAO_AUTH_URL}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md shadow-sm font-medium transition-colors"
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
