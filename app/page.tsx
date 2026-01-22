import { auth, db } from '@/lib/firebase';

export default function Home() {
  console.log('Firebase Auth:', auth);
  console.log('Firebase DB:', db);
  return (
    <>
     <div className="p-8">
      <h1 className="text-2xl font-bold">ChatFutsal</h1>
      <p>Firebase 연동 테스트 - 콘솔 확인</p>
    </div>
    {/* firebase 연동 확인 */}
    
      <div className="flex justify-center">
        <header className="flex bg-red-600">CHATFUTSAL</header>
      </div>
      <div className="h-100">
        <main className="bg-green-600">소통하며 풋살하자 CHATFUTSAL</main>
      </div>
      <div>
        <footer className="bg-blue-500">2026 chatfutsal</footer>
      </div>
    </>
  );
}
