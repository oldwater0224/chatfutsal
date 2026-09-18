"use client";

import BottomNav from "@/src/components/BottomNav";
import { useAuth } from "@/src/hooks/useAuth";
import { useMyApplications } from "@/src/hooks/useApplications";
import { cancelApplication } from "@/src/lib/services";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: { label: "대기중", className: "bg-yellow-100 text-yellow-700" },
  accepted: { label: "수락됨", className: "bg-green-100 text-green-700" },
  rejected: { label: "거절됨", className: "bg-red-100 text-red-700" },
};

export default function MyApplicationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { applications, isLoading: appsLoading } = useMyApplications(user?.uid);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, router, user]);

  if (authLoading || appsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleCancel = async (applicationId: string, postId: string) => {
    const confirmed = window.confirm("신청을 취소하시겠습니까?");
    if (!confirmed) return;

    try {
      await cancelApplication(applicationId, postId, user.uid);
    } catch {
      alert("취소에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/mypage" className="text-gray-600 text-xl">
            ←
          </Link>
          <h1 className="font-bold">내 참가 신청 내역</h1>
        </div>
      </header>

      <main className="pt-14 pb-20">
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <span className="text-5xl mb-4">📋</span>
            <p className="font-medium">신청 내역이 없어요</p>
            <Link
              href="/"
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              모집글 보러가기
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {applications.map((app) => {
              const status = STATUS_STYLE[app.status];

              return (
                <div key={app.id} className="bg-white p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/recruit/${app.postId}`}
                      className="font-semibold text-gray-900 hover:underline flex-1 mr-2 line-clamp-1"
                    >
                      {app.postTitle}
                    </Link>
                    <span className={`shrink-0 px-2 py-0.5 text-xs rounded font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  {app.message && (
                    <p className="text-sm text-gray-500 mb-2">
                      &ldquo;{app.message}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {app.createdAt.toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>

                    {app.status === "pending" && (
                      <button
                        onClick={() => handleCancel(app.id, app.postId)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        신청 취소
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
