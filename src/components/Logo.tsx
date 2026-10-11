import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" aria-label="ChatFutsal 홈" className="flex items-center gap-1.5">
      <svg viewBox="0 0 32 32" className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16 3C8.8 3 3 8.2 3 14.6c0 3.6 1.8 6.8 4.7 8.9L6.5 29l6.1-3.2c1.1.2 2.2.3 3.4.3 7.2 0 13-5.2 13-11.5S23.2 3 16 3z"
        />
        <circle cx="16" cy="14.6" r="6.6" fill="white" />
        <polygon
          fill="currentColor"
          points="16,11.9 18.6,13.8 17.6,16.8 14.4,16.8 13.4,13.8"
        />
      </svg>
      <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">
        chat<span className="text-green-600">futsal</span>
      </span>
    </Link>
  );
}
