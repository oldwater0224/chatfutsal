'use client';

import { useState } from 'react';
import Header from '@/src/components/Header';
import BottomNav from '@/src/components/BottomNav';
import MatchFilter from '@/src/components/MatchFilter';
import MatchCard from '@/src/components/MatchCard';

// 임시 더미 데이터 (나중에 Firestore에서 가져올 예정)
const dummyMatches = [
  {
    id: '1',
    title: '가산 풋살파크 6vs6',
    date: '2025-01-25',
    time: '19:00',
    location: '서울 금천구 가산동',
    currentParticipants: 8,
    maxParticipants: 12,
    level: 'amateur',
  },
  {
    id: '2',
    title: '잠실 실내풋살장',
    date: '2025-01-25',
    time: '20:00',
    location: '서울 송파구 잠실동',
    currentParticipants: 12,
    maxParticipants: 12,
    level: 'semipro',
  },
  {
    id: '3',
    title: '판교 풋살클럽 비기너 매치',
    date: '2025-01-25',
    time: '18:00',
    location: '경기 성남시 분당구',
    currentParticipants: 5,
    maxParticipants: 10,
    level: 'beginner',
  },
  {
    id: '4',
    title: '인천 청라 주말 매치',
    date: '2025-01-26',
    time: '10:00',
    location: '인천 서구 청라동',
    currentParticipants: 6,
    maxParticipants: 12,
    level: 'pro',
  },
];

export default function Home() {
  const [filters, setFilters] = useState({ date: '', region: 'all' });

  const handleFilterChange = (newFilters: { date: string; region: string }) => {
    setFilters(newFilters);
    console.log('필터 변경:', newFilters);
    // TODO: 필터에 맞는 매치 목록 불러오기
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-14 pb-16">
        <MatchFilter onFilterChange={handleFilterChange} />
        
        <div className="mt-2">
          {dummyMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}