"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { iconButtonBaseClass, primaryButtonClass } from "./ui/styles";

interface SubHeaderProps {
  title: ReactNode;
  backHref?: string;
  right?: ReactNode;
  fixed?: boolean;
}

const backButtonClass = `-ml-2 ${iconButtonBaseClass} text-gray-900 hover:bg-gray-100`;

export default function SubHeader({ title, backHref, right, fixed = true }: SubHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={`${
        fixed ? "fixed top-0 left-0 right-0 z-50" : "shrink-0"
      } bg-white border-b border-gray-100`}
    >
      <div className="max-w-2xl mx-auto h-14 px-4 flex items-center gap-1">
        {backHref ? (
          <Link href={backHref} aria-label="뒤로 가기" className={backButtonClass}>
            <ChevronLeft className="w-6 h-6" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로 가기"
            className={backButtonClass}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <h1 className="flex-1 min-w-0 truncate text-[17px] font-semibold text-gray-900">{title}</h1>
        {right && <div className="shrink-0 flex items-center gap-1">{right}</div>}
      </div>
    </header>
  );
}

export const headerActionButtonClass = `${primaryButtonClass} h-9 px-4 text-[13px]`;
