import Link from "next/link";
import Logo from "@/src/components/Logo";
import { primaryButtonClass } from "@/src/components/ui/styles";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-white p-4">
      <Logo />
      <p className="mt-8 text-5xl font-bold text-green-600">404</p>
      <h2 className="mt-3 text-lg font-bold text-gray-900">페이지를 찾을 수 없어요</h2>
      <p className="mt-1 text-sm text-gray-500">주소가 잘못되었거나 삭제된 페이지예요</p>
      <Link href="/" className={`${primaryButtonClass} mt-6 h-10 px-5 text-sm`}>
        홈으로 돌아가기
      </Link>
    </div>
  );
}
