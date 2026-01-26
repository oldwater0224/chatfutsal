"use client";

import { db } from "@/src/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { useState } from "react";

export default function FirebaseTestPage() {
  const [result, setResult] = useState<string>("테스트 전");
  const [loading, setLoading] = useState(false);

  const testRead = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      setResult(`읽기 성공! 문서 수: ${snapshot.size}`);
    } catch (e) {
      const error = e as Error;  // ✅ 타입 캐스팅
      setResult(`읽기 실패: ${error.message}`);
    }
    setLoading(false);
  };

  const testWrite = async () => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "test"), {
        message: "테스트",
        createdAt: new Date(),
      });
      setResult(`쓰기 성공! 문서 ID: ${docRef.id}`);
    } catch (e) {
      const error = e as Error;  // ✅ 타입 캐스팅
      setResult(`쓰기 실패: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Firebase 연결 테스트</h1>
      
      <div className="space-x-4">
        <button
          onClick={testRead}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          읽기 테스트
        </button>
        <button
          onClick={testWrite}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          쓰기 테스트
        </button>
      </div>

      <div className="p-4 bg-gray-100 rounded">
        <p className="font-mono">{loading ? "로딩 중..." : result}</p>
      </div>
    </div>
  );
}