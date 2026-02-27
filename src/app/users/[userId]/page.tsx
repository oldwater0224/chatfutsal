'use client'

import { useAuth } from "@/src/hooks/useAuth";
import { startChat } from "@/src/lib/chatService";
import { db } from "@/src/lib/firebase";
import { User } from "@/src/types";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";



export default function UserProfilePage () {
  const params = useParams();
  const router = useRouter();
  const targetUserId = params.userId as string;

  const {user : currentUser} = useAuth();
  const [targetUser , setTargetUser] = useState<User | null>(null);
  const [isLoading , setIsLoading] = useState(true);
  const [startingChat , setStartingChat] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db , 'users' , targetUserId));

      if(userDoc.exists()){
        setTargetUser({
          uid : userDoc.id , 
          ...userDoc.data() , 

        } as User);
      }
      setIsLoading(false);
    };

    fetchUser();





  } , [targetUserId]);


  const handleStartChat = async () => {
    if(!currentUser || !targetUser) return;
    setStartingChat(true);
    try{
      const roomId = await startChat(
        {uid : currentUser.uid , displayName : currentUser.displayName || '사용자'} , 
        {uid : targetUser.uid , displayName : targetUser.displayName} , 
      );
      router.push(`/chat/${roomId}`);

    }catch(e){
      console.error('채팅 시작 에러:' , e );
      alert('채팅을 시작 할 수 없습니다.');
    }
    setStartingChat(false);
}
if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if(!targetUser) {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">사용자를 찾을 수 없습니다</p>
        <Link href="/" className="text-green-600">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  const isMe = currentUser?.uid === targetUser.uid;




  return (
     <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="max-w-md px-4 h-14 flex items-center">
          <button onClick={() => router.back()} className="text-gray-600 mr-4">
            ←
          </button>
          <h1 className="font-bold">프로필</h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="pt-14 pb-24 px-4">
        <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-green-600 text-3xl font-bold">
                {targetUser.displayName?.charAt(0) || 'U'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {targetUser.displayName}
            </h2>
            <p className="text-gray-500 text-sm mt-1">{targetUser.email}</p>
          </div>
        </div>
      </main>

      {/* 하단 버튼 */}
      {!isMe && currentUser && (
        <div className="fixed bottom-0  left-0 right-0 bg-white border-t p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleStartChat}
              disabled={startingChat}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {startingChat ? '로딩 중...' : '채팅하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}