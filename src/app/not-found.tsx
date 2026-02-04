import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <span className="text-6xl mb-4">🔍</span>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        페이지를 찾을 수 없습니다.
      </h2>
      <p className="text-gray-500 mb-6">
        주소가 잘못되었거나 삭제된 페이지입니다.
      </p>
      <Link
        href="/"
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}