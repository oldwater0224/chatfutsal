import Link from 'next/link';
import { Match } from '@/src/types';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const isFull = match.currentParticipants >= match.maxParticipants;

  const levelColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    amateur: 'bg-blue-100 text-blue-700',
    'semi-pro': 'bg-purple-100 text-purple-700',
    pro: 'bg-red-100 text-red-700',
  };

  const levelLabels: Record<string, string> = {
    beginner: '비기너',
    amateur: '아마추어',
    'semi-pro': '세미프로',
    pro: '프로',
  };

  // 참가율 계산
  const participantRate =
    (match.currentParticipants / match.maxParticipants) * 100;

  return (
    <Link href={`/matches/${match.id}`}>
      <div className="bg-white p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">{match.title}</h3>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              levelColors[match.level]
            }`}
          >
            {levelLabels[match.level]}
          </span>
        </div>

        <div className="text-sm text-gray-500 space-y-1">
          <p>📅 {match.date} {match.time}</p>
          <p>📍 {match.location}</p>
          <p>💰 {match.price.toLocaleString()}원</p>
        </div>

        {/* 참가자 프로그레스 바 */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span
              className={`text-sm font-medium ${
                isFull ? 'text-red-500' : 'text-green-600'
              }`}
            >
              {isFull
                ? '마감'
                : `${match.currentParticipants}/${match.maxParticipants}명`}
            </span>
            <span className="text-xs text-gray-400">
              {isFull ? '' : '자세히 보기 →'}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? 'bg-red-400' : 'bg-green-400'
              }`}
              style={{ width: `${Math.min(participantRate, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}