'use client';

import { useState } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { seedMatches } from '@/src/lib/seedMatches';
import { seedTestUsers, seedChatRooms, seedChatRoomsWithUser } from '@/src/lib/seedChats';

export default function SeedPage() {
  const { user, userData, isLoading } = useAuth();
  const [status, setStatus] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const handleSeedMatches = async () => {
    setIsRunning(true);
    setStatus('매치 데이터 생성 중...');
    try {
      await seedMatches(20);
      setStatus('✅ 매치 20개 생성 완료!');
    } catch (error) {
      setStatus('❌ 매치 생성 실패: ' + error);
    }
    setIsRunning(false);
  };

  const handleSeedUsers = async () => {
    setIsRunning(true);
    setStatus('테스트 유저 생성 중...');
    try {
      await seedTestUsers();
      setStatus('✅ 테스트 유저 6명 생성 완료!');
    } catch (error) {
      setStatus('❌ 유저 생성 실패: ' + error);
    }
    setIsRunning(false);
  };

  // 로그인 필요 없음 - 테스트 유저끼리 채팅
  const handleSeedChats = async () => {
    setIsRunning(true);
    setStatus('테스트 유저 채팅방 생성 중...');
    try {
      await seedChatRooms();
      setStatus('✅ 테스트 유저 채팅방 6개 생성 완료!');
    } catch (error) {
      setStatus('❌ 채팅방 생성 실패: ' + error);
    }
    setIsRunning(false);
  };

  // 로그인 필요 - 내 채팅방 생성
  const handleSeedMyChats = async () => {
    if (!user || !userData) {
      setStatus('❌ 로그인이 필요합니다');
      return;
    }

    setIsRunning(true);
    setStatus('내 채팅방 생성 중...');
    try {
      await seedChatRoomsWithUser(user.uid, userData.displayName || '사용자');
      setStatus('✅ 내 채팅방 3개 생성 완료!');
    } catch (error) {
      setStatus('❌ 내 채팅방 생성 실패: ' + error);
    }
    setIsRunning(false);
  };

  // 전체 생성 (로그인 없이 가능)
  const handleSeedAll = async () => {
    setIsRunning(true);
    try {
      setStatus('1/3 매치 데이터 생성 중...');
      await seedMatches(20);

      setStatus('2/3 테스트 유저 생성 중...');
      await seedTestUsers();

      setStatus('3/3 테스트 유저 채팅방 생성 중...');
      await seedChatRooms();

      setStatus('✅ 전체 더미 데이터 생성 완료!\n\n테스트 유저로 로그인하려면:\n- 이메일: player1@test.com ~ player6@test.com\n- (Firebase Auth에 등록 필요)');
    } catch (error) {
      setStatus('❌ 생성 실패: ' + error);
    }
    setIsRunning(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🛠️ 테스트 데이터 생성</h1>
        <p className="text-gray-500 text-sm mb-6">
          개발/테스트용 더미 데이터를 생성합니다.
          <br />
          배포 전에 이 페이지를 삭제해주세요!
        </p>

        {/* 로그인 상태 */}
        <div className="bg-white rounded-lg p-4 mb-6 border">
          <p className="text-sm text-gray-500">현재 로그인:</p>
          <p className="font-medium">
            {user ? `${userData?.displayName} (${user.email})` : '비로그인 상태'}
          </p>
        </div>

        {/* 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={handleSeedMatches}
            disabled={isRunning}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ⚽ 매치 20개 생성
          </button>

          <button
            onClick={handleSeedUsers}
            disabled={isRunning}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            👤 테스트 유저 6명 생성
          </button>

          <button
            onClick={handleSeedChats}
            disabled={isRunning}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            💬 테스트 유저 채팅방 6개 생성 (로그인 불필요)
          </button>

          <hr className="my-4" />

          <button
            onClick={handleSeedAll}
            disabled={isRunning}
            className="w-full py-4 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            🚀 전체 더미 데이터 한번에 생성 (로그인 불필요)
          </button>

          <hr className="my-4" />

          <button
            onClick={handleSeedMyChats}
            disabled={isRunning || !user}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            💬 내 채팅방 3개 생성 (로그인 필요)
          </button>
        </div>

        {/* 상태 메시지 */}
        {status && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm font-mono whitespace-pre-wrap">{status}</p>
          </div>
        )}

        {/* 테스트 유저 정보 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-bold text-blue-800 mb-2">📋 생성되는 테스트 유저</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 축구왕김철수 (test_user_1)</li>
            <li>• 골키퍼박영희 (test_user_2)</li>
            <li>• 드리블러이민수 (test_user_3)</li>
            <li>• 수비수최지영 (test_user_4)</li>
            <li>• 공격수정대호 (test_user_5)</li>
            <li>• 미드필더한소희 (test_user_6)</li>
          </ul>
        </div>

        {/* 안내 */}
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ 이 페이지는 개발용입니다.
            <br />
            배포 시 <code className="bg-yellow-100 px-1 rounded">/seed</code> 페이지를 삭제해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}