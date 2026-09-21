"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { useNotifications } from "@/src/hooks/useNotifications";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/src/lib/services/notificationService";
import Header from "@/src/components/Header";
import BottomNav from "@/src/components/BottomNav";
import {
  Bell,
  MessageCircle,
  UserCheck,
  UserX,
  UserPlus,
  CheckCheck,
} from "lucide-react";
import { Notification } from "@/src/types";

const ICON_MAP: Record<string, typeof Bell> = {
  new_message: MessageCircle,
  application_received: UserPlus,
  application_accepted: UserCheck,
  application_rejected: UserX,
};

const ICON_COLOR_MAP: Record<string, string> = {
  new_message: "bg-blue-100 text-blue-600",
  application_received: "bg-green-100 text-green-600",
  application_accepted: "bg-emerald-100 text-emerald-600",
  application_rejected: "bg-red-100 text-red-600",
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
      className={`w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors ${
        !notification.isRead ? "bg-green-50/50" : ""
      }`}
    >
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!notification.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 mt-0.5 truncate">
          {notification.body}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="shrink-0 w-2.5 h-2.5 bg-green-500 rounded-full mt-1.5" />
      )}
    </button>
  );
}

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { notifications, unreadCount, isLoading } = useNotifications(user?.uid);
  const router = useRouter();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    router.push(notification.link);
  };
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleMarkAllRead = async () => {
    if (user?.uid && unreadCount > 0) {
      await markAllNotificationsAsRead(user.uid);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-14 pb-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </main>
        <BottomNav />
      </div>
    );
  }

  

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-14 pb-20">
        <div className="bg-white border-b">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-bold">알림</h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
              >
                <CheckCheck className="w-4 h-4" />
                <span>모두 읽음</span>
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-700 font-medium mb-1">알림이 없어요</p>
            <p className="text-gray-500 text-sm">
              새로운 소식이 생기면 알려드릴게요
            </p>
          </div>
        ) : (
          <div className="bg-white max-w-2xl mx-auto divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
