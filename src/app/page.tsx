'use client';

import { useState } from 'react';
import { useMatches } from '@/src/hooks/useMatches';
import Header from '@/src/components/Header';
import BottomNav from '@/src/components/BottomNav';
import MatchFilter from '@/src/components/MatchFilter';
import MatchCard from '@/src/components/MatchCard';

interface FilterState {
  date: string;
  region: string;
  level: string;
}

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>({
    date: '',
    region: '',
    level: '',
  });

  const { matches, isLoading } = useMatches(filters);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-14 pb-20">
        {/* 필터 */}
        <MatchFilter filters={filters} onFilterChange={handleFilterChange} />

        {/* 매치 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-5xl mb-4">⚽</span>
            <p className="text-gray-700 font-medium mb-1">매치가 없어요</p>
            <p className="text-gray-500 text-sm">
              {filters.date || filters.region || filters.level
                ? '다른 조건으로 검색해보세요'
                : '곧 새로운 매치가 등록될 거예요'}
            </p>
            {(filters.date || filters.region || filters.level) && (
              <button
                onClick={() => setFilters({ date: '', region: '', level: '' })}
                className="mt-4 px-4 py-2 text-green-600 font-medium hover:bg-green-50 rounded-lg"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* 결과 개수 */}
            <div className="px-4 py-2 text-sm text-gray-500">
              {matches.length}개의 매치
            </div>

            {/* 매치 카드 목록 */}
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}