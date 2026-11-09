"use client";

import { useState } from "react";
import { Application, RecruitPost } from "../types";
import {
  acceptApplication,
  ApplicationError,
  displayApplicationStatus,
  rejectApplication,
} from "../lib/services";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { avatarClass, badgeClass, focusRingClass } from "./ui/styles";

interface ApplicationListProps {
  applications: Application[];
  postId: string;
  postStatus?: RecruitPost["status"];
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: { label: "대기 중", className: "bg-yellow-50 text-yellow-700" },
  accepted: { label: "수락", className: "bg-green-50 text-green-700" },
  rejected: { label: "거절", className: "bg-red-50 text-red-600" },
  closed: { label: "마감", className: "bg-gray-100 text-gray-600" },
};

export default function ApplicationList({
  applications,
  postId,
  postStatus,
}: ApplicationListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (app: Application) => {
    setProcessingId(app.id);
    try {
      await acceptApplication(app.id, postId);
    } catch (e) {
      alert(e instanceof ApplicationError ? e.message : "수락하지 못했어요");
    }
    setProcessingId(null);
  };

  const handleReject = async (app: Application) => {
    setProcessingId(app.id);
    try {
      await rejectApplication(app.id, postId, app.applicantId);
    } catch (e) {
      alert(e instanceof ApplicationError ? e.message : "거절하지 못했어요");
    }
    setProcessingId(null);
  };

  if (applications.length === 0) {
    return (
      <p className="py-6 text-center text-[13px] text-gray-500">아직 들어온 신청이 없어요</p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {applications.map((app) => {
        // 마감된 글의 대기 신청은 정리 쓰기가 반영되기 전이라도 "마감"으로 보여주고,
        // 수락·거절 버튼도 숨긴다 (마감된 글은 수락이 거부된다)
        const displayStatus = displayApplicationStatus(app.status, postStatus);
        const status = STATUS_STYLE[displayStatus];
        const isProcessing = processingId === app.id;

        return (
          <li key={app.id} className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href={`/users/${app.applicantId}`}
                  aria-label={`${app.applicantName} 프로필`}
                  className={`w-10 h-10 text-[15px] ${avatarClass} ${focusRingClass}`}
                >
                  {app.applicantName.charAt(0)}
                </Link>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/users/${app.applicantId}`}
                      className={`text-[15px] font-medium text-gray-900 hover:underline rounded-sm ${focusRingClass}`}
                    >
                      {app.applicantName}
                    </Link>
                    <span className={`${badgeClass} ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  {app.message && (
                    <p className="mt-1 text-[13px] text-gray-600 truncate">
                      {app.message}
                    </p>
                  )}
                </div>
              </div>

              {displayStatus === "pending" && (
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={() => handleAccept(app)}
                    disabled={isProcessing}
                    aria-label={`${app.applicantName} 신청 수락`}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer transition-colors ${focusRingClass}`}
                  >
                    <Check className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleReject(app)}
                    disabled={isProcessing}
                    aria-label={`${app.applicantName} 신청 거절`}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors ${focusRingClass}`}
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
