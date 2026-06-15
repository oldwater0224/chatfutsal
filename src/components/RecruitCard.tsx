import Link from "next/link";
import { RecruitPost, LEVEL_COLORS, LEVEL_LABELS } from "@/src/types";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";

interface RecruitCardProps {
  post: RecruitPost;
}

export default function RecruitCard({ post }: RecruitCardProps) {
  const isClosed = post.status === "closed";

  return (
    <div className={`mx-auto max-w-2xl ${isClosed ? "opacity-60" : ""}`}>
      <Link
        href={`/recruit/${post.id}`}
        className="block bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-1 mr-3">
            {isClosed && (
              <span className="shrink-0 px-2 py-0.5 bg-gray-200 text-gray-500 text-xs font-medium rounded">
                마감
              </span>
            )}
            <h3 className="text-lg font-bold text-gray-900 leading-snug">
              {post.title}
            </h3>
          </div>
          <span
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${LEVEL_COLORS[post.level]}`}
          >
            {LEVEL_LABELS[post.level]}
          </span>
        </div>

        <div className="space-y-2.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <span className="font-medium">{post.date} {post.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-red-500" />
            </div>
            <span className="font-medium">{post.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <span className="font-medium">{post.needCount}명 모집</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-700 text-xs font-bold">
                {post.authorName?.charAt(0)}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">{post.authorName}</span>
              <span className="text-xs text-gray-400 ml-2">
                {post.createdAt instanceof Date
                  ? post.createdAt.toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
            <span>상세보기</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </div>
  );
}
