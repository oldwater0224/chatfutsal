import Link from "next/link";
import { Match } from "@/src/types";
import { Calendar, MapPin, SpotlightIcon, Users } from "lucide-react";

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const isFull = match.currentParticipants >= match.maxParticipants;

  const levelColors: Record<string, string> = {
    beginner: "bg-green-100 text-green-700",
    amateur: "bg-blue-100 text-blue-700",
    "semi-pro": "bg-purple-100 text-purple-700",
    pro: "bg-red-100 text-red-700",
  };

  const levelLabels: Record<string, string> = {
    beginner: "비기너",
    amateur: "아마추어",
    "semi-pro": "세미프로",
    pro: "프로",
  };

  // 참가율 계산
  const participantRate =
    (match.currentParticipants / match.maxParticipants) * 100;

  return (
    <Link href={`/matches/${match.id}`}
  className="block overflow-hidden mx-auto w-full max-w-3xl sm:max-w-2xl">
      <div className="bg-white p-4 border-b border-gray-100 transition-colors">
        <div className="">
          <div className="flex items-start gap-5 mb-2">
            <h3 className="font-semibold text-gray-900">{match.title}</h3>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                levelColors[match.level]
              }`}
            >
              {levelLabels[match.level]}
            </span>
          </div>
        </div>

        <div className="">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>
                {match.date} {match.time}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>{match.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <SpotlightIcon className="w-4 h-4 text-purple-300" />
              <span>₩{match.price?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 참가자 프로그레스 바 */}
        <div className="">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                <span
                  className={`text-sm font-medium  ${
                    isFull ? "text-red-500" : "text-green-600"
                  }`}
                >
                  {isFull
                    ? "마감"
                    : `${match.currentParticipants}/${match.maxParticipants}명`}
                </span>
              </div>
              <span className="text-xs text-gray-400">
               
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFull ? "bg-red-400" : "bg-green-400"
                }`}
                style={{ width: `${Math.min(participantRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
