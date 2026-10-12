import Link from "next/link";
import { RecruitPost, LEVEL_LABELS, LEVEL_COLORS } from "@/src/types";
import { ChevronRight } from "lucide-react";

interface RecruitCardProps {
  post: RecruitPost;
}

function getStatus(post: RecruitPost) {
  const remaining = post.needCount - (post.acceptedCount || 0);
  if (post.status === "closed" || remaining <= 0) {
    return { label: "마감", className: "bg-gray-100 text-gray-400" };
  }
  if (remaining === 1) {
    return { label: "마감임박", className: "bg-red-50 text-red-500" };
  }
  return { label: `${remaining}자리 남음`, className: "bg-green-50 text-green-700" };
}

export default function RecruitCard({ post }: RecruitCardProps) {
  const status = getStatus(post);
  const isClosed = status.label === "마감";

  return (
    <Link
      href={`/recruit/${post.id}`}
      className={`flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70 -mx-4 px-4 transition-colors ${
        isClosed ? "opacity-50" : ""
      }`}
    >
      <span className="w-12 shrink-0 text-[17px] font-bold text-gray-900 tabular-nums">
        {post.time || "--:--"}
      </span>

      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-semibold text-gray-900 truncate">{post.title}</h3>
        <p className="mt-0.5 text-[13px] text-gray-500 truncate">{post.location}</p>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <span className={`px-1.5 py-0.5 rounded font-medium ${LEVEL_COLORS[post.level]}`}>
            {LEVEL_LABELS[post.level]}
          </span>
          <span className="text-gray-400">
            {post.acceptedCount || 0}/{post.needCount}명
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1">
        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${status.className}`}>
          {status.label}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </Link>
  );
}
