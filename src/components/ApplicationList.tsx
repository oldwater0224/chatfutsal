"use client";

import { useState } from "react";
import { Application } from "../types";
import { acceptApplication, rejectApplication } from "../lib/services";
import Link from "next/link";
import { Check, X } from "lucide-react";

interface ApplicationListProps {
  applications: Application[];
  needCount: number;
  postId: string;
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: { label: "대기중", className: "bg-yellow-100 text-yellow-700" },
  accepted: { label: "수락", className: "bg-green-100 text-green-700" },
  rejected: { label: "거절", className: "bg-red-100 text-red-700" },
};

export default function ApplicationList({
  applications,
  needCount,
  postId,
}: ApplicationListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (app: Application) => {
    setProcessingId(app.id);
    try {
      await acceptApplication(app.id, postId, needCount);
    } catch {
      alert("수락에 실패했습니다.");
    }
    setProcessingId(null);
  };

  const handleReject = async (app: Application) => {
    setProcessingId(app.id);
    try {
      await rejectApplication(app.id, postId, app.applicantId);
    } catch {
      alert("거절에 실패했습니다.");
    }
    setProcessingId(null);
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        아직 신청이 없습니다
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {applications.map((app) => {
        const status = STATUS_STYLE[app.status];
        const isProcessing = processingId === app.id;

        return (
          <li key={app.id} className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href={`/users/${app.applicantId}`}
                  className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center shrink-0"
                >
                  <span className="text-green-600 font-medium text-sm">
                    {app.applicantName.charAt(0)}
                  </span>
                </Link>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/users/${app.applicantId}`}
                      className="font-medium text-gray-900 text-sm hover:underline"
                    >
                      {app.applicantName}
                    </Link>
                    <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  {app.message && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {app.message}
                    </p>
                  )}
                </div>
              </div>

              {app.status === "pending" && (
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => handleAccept(app)}
                    disabled={isProcessing}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReject(app)}
                    disabled={isProcessing}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
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
