import Link from "next/link";
import { RecruitPost, LEVEL_COLORS, LEVEL_LABELS } from "@/src/types";
import { Calendar, MapPin, Users } from "lucide-react";

interface RecruitCardProps {
  post: RecruitPost;
}

export default function RecruitCard({ post }: RecruitCardProps) {
  return (
    <Link
      href={`/recruit/${post.id}`}
      className="block overflow-hidden mx-auto w-full max-w-2xl"
    >
      <div className="bg-white p-4 border-b transition-colors">
        <div className="flex mb-3">
          <h3 className="font-semibold text-gray-900 mr-4">{post.title}</h3>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${LEVEL_COLORS[post.level]}`}
          >
            {LEVEL_LABELS[post.level]}
          </span>
        </div>

        <div className="text-sm text-gray-500 space-y-1">
          <p className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            {post.date} {post.time}
          </p>
          <p className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-red-500" />
            {post.location}
          </p>
          <p className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {post.needCount}명 모집
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>{post.authorName}</span>
          <span>
            {post.createdAt.toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
