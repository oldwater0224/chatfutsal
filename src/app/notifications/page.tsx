"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { useNotifications } from "@/src/hooks/useNotifications";
import { useAppData } from "@/src/contexts/AppDataContext";
import LoadMoreButton from "@/src/components/LoadMoreButton";
import Header from "@/src/components/Header";
import BottomNav from "@/src/components/BottomNav";
import {
  Bell,
  MessageCircle,
  UserCheck,
  UserX,
  UserPlus,
  CheckCheck,
  CalendarX,
  Lock,
} from "lucide-react";
import { Notification } from "@/src/types";
import { spinnerClass } from "@/src/components/ui/styles";

const ICON_MAP: Record<string, typeof Bell> = {
  new_message: MessageCircle,
  application_received: UserPlus,
  application_accepted: UserCheck,
  application_rejected: UserX,
  recruit_deleted: CalendarX,
  recruit_closed: Lock,
};

const ICON_COLOR_MAP: Record<string, string> = {
  new_message: "bg-blue-100 text-blue-600",
  application_received: "bg-green-100 text-green-600",
  application_accepted: "bg-green-100 text-green-600",
  application_rejected: "bg-red-100 text-red-600",
  recruit_deleted: "bg-gray-100 text-gray-600",
  recruit_closed: "bg-gray-100 text-gray-600",
};

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const Icon = ICON_MAP[notification.type] || Bell;
  const colorClass = ICON_COLOR_MAP[notification.type] || "bg-gray-100 text-gray-600";

  return (
    <button
      onClick={onClick}
      className={`-mx-4 w-[calc(100%+2rem)] flex items-start gap-3 px-4 py-4 text-left border-b border-gray-100 transition-colors cursor-pointer ${
        !notification.isRead ? "bg-green-50/40 hover:bg-green-50/70" : "hover:bg-gray-50/70"
      }`}
    >
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] leading-snug ${!notification.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
          {notification.title}
        </p>
        <p className="text-[13px] text-gray-500 mt-0.5 truncate">
          {notification.body}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2" />
      )}
    </button>
  );
}

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { notifications, hasMore, loadMore, isLoading, markRead, markAllRead } = useNotifications(user?.uid);
  const { notificationUnread: unreadCount } = useAppData();
  const router = useRouter();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markRead(notification.id);
    }
    router.push(notification.link);
  };
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleMarkAllRead = async () => {
    if (unreadCount > 0) {
      await markAllRead();
    }
  };

  if (!authLoading && !user) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-14 pb-24">
        <div className="max-w-2xl mx-auto px-4">
          <div className="pt-3 pb-2 flex items-center justify-between">
            <h1 className="text-[22px] font-bold text-gray-900">알림</h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[13px] font-semibold text-green-600 hover:text-green-700 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                모두 읽음
              </button>
            )}
          </div>

          {authLoading || isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className={spinnerClass} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-[15px] font-semibold text-gray-900">알림이 없어요</p>
              <p className="mt-1 text-sm text-gray-500">새로운 소식이 생기면 알려드릴게요</p>
            </div>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                </li>
              ))}
            </ul>
          )}
          {!(authLoading || isLoading) && hasMore && <LoadMoreButton onClick={loadMore} label="이전 알림 더 보기" />}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
