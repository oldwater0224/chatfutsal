'use client'

import { seedMatches } from "@/src/lib/seedMatches";
import { useState } from "react";

export default function SampleDataTest() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      await seedMatches();
      setDone(true);
    } catch (e) {
      console.error("에러:", e);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">테스트 페이지</h1>

      <button
        onClick={handleSeed}
        disabled={loading || done}
        className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
      >
        {loading ? "추가 중..." : done ? "완료!" : "샘플 매치 데이터 추가"}
      </button>

      {done && (
        <p className="mt-4 text-green-600">
          Firebase 콘솔에서 matches 컬렉션 확인해보세요!
        </p>
      )}
    </div>
  );
}
