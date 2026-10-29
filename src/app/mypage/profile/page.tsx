"use client";

import SubHeader from "@/src/components/SubHeader";
import {
  fieldInputClass,
  fieldLabelClass,
  primaryButtonClass,
  spinnerClass,
} from "@/src/components/ui/styles";
import { useAuth } from "@/src/hooks/useAuth";
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  updateDisplayName,
  validateDisplayName,
} from "@/src/lib/services";
import type { User as AuthUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 현재 닉네임이 정해진 뒤에 마운트해 초기값을 useState로 바로 받는다
function ProfileForm({ authUser, currentName }: { authUser: AuthUser; currentName: string }) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const check = validateDisplayName(name, currentName);
  const inputError = !check.ok && check.reason === "invalid" ? check.message : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!check.ok) return;

    setError("");
    setIsSaving(true);
    try {
      await updateDisplayName(authUser, name, currentName);
      router.push("/mypage");
    } catch (e) {
      console.error("닉네임 변경 에러:", e);
      setError("닉네임을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <main className="pt-14 pb-28 max-w-2xl mx-auto px-4">
        <div className="pt-6">
          <label htmlFor="displayName" className={fieldLabelClass}>
            닉네임
          </label>
          <input
            id="displayName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldInputClass}
            placeholder="풋살러1"
            autoComplete="nickname"
            aria-invalid={!!inputError}
            aria-describedby="displayName-help"
          />
          <p
            id="displayName-help"
            className={`mt-2 text-[13px] ${inputError ? "text-red-500" : "text-gray-400"}`}
          >
            {inputError || `${DISPLAY_NAME_MIN}~${DISPLAY_NAME_MAX}자`}
          </p>
          <p className="mt-4 text-[13px] text-gray-400">
            이미 작성한 모집글·신청·채팅에는 바뀌기 전 닉네임이 그대로 표시돼요.
          </p>
          {error && <p className="mt-4 text-[13px] text-red-500">{error}</p>}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            type="submit"
            disabled={!check.ok || isSaving}
            className={`${primaryButtonClass} w-full h-12 text-[15px]`}
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function ProfileEditPage() {
  const { user, userData, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (!isLoading && !user) return null;

  return (
    <div className="min-h-screen bg-white">
      <SubHeader title="프로필 수정" backHref="/mypage" />

      {isLoading || !user ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className={spinnerClass} />
        </div>
      ) : (
        <ProfileForm
          authUser={user}
          currentName={userData?.displayName || user.displayName || ""}
        />
      )}
    </div>
  );
}
