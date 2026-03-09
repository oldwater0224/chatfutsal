'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useChatRooms } from '@/src/hooks/useChatRoom';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { totalUnread } = useChatRooms(user?.uid);

  const navItems = [
    { href: '/', label: '홈', icon: '⚽' },
    { href: '/recruit', label: '용병', icon: '📝' },
    { href: '/chat', label: '채팅', icon: '💬', badge: totalUnread },
    { href: '/mypage', label: 'MY', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 min-w-16 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-green-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <span className="text-xl">{item.icon}</span>
                {/* 배지 */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-3 min-w-4 h-4 bg-red-500 rounded-full flex items-center justify-center px-1">
                    <span className="text-white text-[10px] font-bold">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  </span>
                )}
              </div>
              <span className={`text-xs ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}