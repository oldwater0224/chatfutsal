"use client";

import { useRouter } from "next/router";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
}

export default function PageHeader({
  title,
  showBack = false,
  backHref,
}: PageHeaderProps) {

  const router = useRouter();

  const handleBack = () => {
    if(backHref){
      router.push(backHref);

    }else {
      router.back();
    }
  }
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
        {showBack && (
          <button
            onClick={handleBack}
            className="text-gray-600 mr-4 text-lg hover:text-gray-900"
          >
            ←
          </button>
        )}
        <h1 className="font-bold text-gray-900">{title}</h1>
      </div>
    </header>
  );
}
