import Link from "next/link";
import { MatchCardProps } from "../types";

export default function MatchCard ({match} : MatchCardProps) { 
  const isFull = match.currentParticipants >= match.maxParticipants;

  const levelColors : Record<string , string> ={
    beginner : 'bg-green-100 text-green-700',
    amateur : 'bg-blue-100 text-blue-700' , 
    semipro : 'bg-purple-100 text-purple-700' , 
    pro : 'bg-red-100 text-red-700',
  };
  const levelLabels :Record<string , string> = {
    beginner : '비기너' , 
    amateur : '아마추어' , 
    semipro : '세미프로' , 
    pro : '프로',

  };




  return (
   <Link href={`/matches/${match.id}`}>
      <div className="bg-white p-4 border-b border-gray-100 hover:bg-gray-50">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">{match.title}</h3>
          <span className={`px-2 py-1 rounded text-xs ${levelColors[match.level]}`}>
            {levelLabels[match.level]}
          </span>
        </div>
        
        <div className="text-sm text-gray-500 space-y-1">
          <p>📅 {match.date} {match.time}</p>
          <p>📍 {match.location}</p>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <span className={`text-sm ${isFull ? 'text-red-500' : 'text-green-600'}`}>
            {isFull ? '마감' : `${match.currentParticipants}/${match.maxParticipants}명`}
          </span>
          <span className="text-xs text-gray-400">자세히 보기 →</span>
        </div>
      </div>
    </Link>
  );
}