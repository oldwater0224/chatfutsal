import Link from "next/link";
import { RecruitPost, LEVEL_LABELS } from "@/src/types";
import { ChevronRight } from "lucide-react";
import SeatDots from "./SeatDots";
import { badgeClass, focusRingInsetClass } from "./ui/styles";

interface RecruitCardProps {
  post: RecruitPost;
}

function getStatus(post: RecruitPost) {
  const remaining = post.needCount - (post.acceptedCount || 0);
  if (post.status === "closed" || remaining <= 0) {
    return { label: "마감", className: "bg-gray-100 text-gray-500", closed: true };
  }
  if (remaining === 1) {
    return { label: "마감임박", className: "bg-red-50 text-red-600", closed: false };
  }
  return { label: `${remaining}자리 남음`, className: "bg-green-50 text-green-700", closed: false };
}

export default function RecruitCard({ post }: RecruitCardProps) {
  const status = getStatus(post);
  const accepted = post.acceptedCount || 0;

  return (
    <Link
      href={`/recruit/${post.id}`}
      className={`flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 -mx-4 px-4 transition-colors ${focusRingInsetClass} ${
        status.closed ? "opacity-50" : ""
      }`}
    >
      <time className="w-14 shrink-0 text-[17px] font-semibold leading-none text-gray-900 tabular-nums">
        {post.time || "--:--"}
      </time>

      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-medium text-gray-900 truncate">{post.title}</h3>
        <p className="mt-1 text-[13px] text-gray-600 truncate">{post.location}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <SeatDots filled={accepted} total={post.needCount} closed={status.closed} />
          <span className="tabular-nums">
            {accepted}/{post.needCount}명
          </span>
          <span aria-hidden="true">·</span>
          <span>{LEVEL_LABELS[post.level]}</span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1">
        <span className={`${badgeClass} tabular-nums ${status.className}`}>{status.label}</span>
        <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
      </div>
    </Link>
  );
}
