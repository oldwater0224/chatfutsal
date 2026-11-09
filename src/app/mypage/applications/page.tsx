"use client";

import BottomNav from "@/src/components/BottomNav";
import SubHeader from "@/src/components/SubHeader";
import {
  badgeClass,
  emptyIconTileClass,
  focusRingClass,
  primaryButtonClass,
  spinnerClass,
} from "@/src/components/ui/styles";
import { useAuth } from "@/src/hooks/useAuth";
import { useMyApplications } from "@/src/hooks/useApplications";
import { ApplicationError, cancelApplication } from "@/src/lib/services";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: { label: "대기 중", className: "bg-yellow-50 text-yellow-700" },
  accepted: { label: "수락됨", className: "bg-green-50 text-green-700" },
  rejected: { label: "거절됨", className: "bg-red-50 text-red-600" },
  closed: { label: "모집 마감", className: "bg-gray-100 text-gray-600" },
};

export default function MyApplicationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { applications, isLoading: appsLoading } = useMyApplications(user?.uid);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, router, user]);

  if (!authLoading && !user) return null;

  const handleCancel = async (applicationId: string, postId: string) => {
    if (!user || !window.confirm("신청을 취소할까요?")) return;
    try {
      await cancelApplication(applicationId, postId, user.uid);
    } catch (e) {
      alert(e instanceof ApplicationError ? e.message : "신청을 취소하지 못했어요");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SubHeader title="참가 신청 내역" backHref="/mypage" />

      <main className="pt-14 pb-24 max-w-2xl mx-auto px-4">
        {authLoading || appsLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className={spinnerClass} role="status" aria-label="불러오는 중" />
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20">
            <div className={emptyIconTileClass}>
              <ClipboardList className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="text-[15px] font-semibold text-gray-900">신청 내역이 없어요</p>
            <p className="mt-1 text-[13px] text-gray-600">마음에 드는 경기에 참가 신청해 보세요</p>
            <Link href="/" className={`${primaryButtonClass} mt-6 h-10 px-5 text-[15px]`}>
              모집글 둘러보기
            </Link>
          </div>
        ) : (
          <ul className="pt-2">
            {applications.map((app) => {
              const status = STATUS_STYLE[app.status];
              return (
                <li key={app.id} className="py-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/recruit/${app.postId}`}
                      className={`min-w-0 text-[15px] font-medium text-gray-900 hover:underline line-clamp-1 rounded-sm ${focusRingClass}`}
                    >
                      {app.postTitle}
                    </Link>
                    <span
                      className={`shrink-0 ${badgeClass} ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {app.message && (
                    <p className="mt-2 text-[13px] text-gray-600 line-clamp-2">
                      &ldquo;{app.message}&rdquo;
                    </p>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500 tabular-nums">
                      {app.createdAt.toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      신청
                    </span>
                    {app.status === "pending" && (
                      <button
                        onClick={() => handleCancel(app.id, app.postId)}
                        className={`h-8 -mr-2 px-2 rounded-lg text-xs font-medium text-gray-600 hover:text-red-600 cursor-pointer transition-colors ${focusRingClass}`}
                      >
                        신청 취소
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
