"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useChatRooms } from "@/src/hooks/useChatRoom";
import { useUnreadNotificationCount } from "@/src/hooks/useNotifications";

type ChatRoomsResult = ReturnType<typeof useChatRooms>;

interface AppData {
  chatRooms: ChatRoomsResult["chatRooms"];
  chatRoomsLoading: boolean;
  totalUnread: number;
  notificationUnread: number;
}

const AppDataContext = createContext<AppData | null>(null);

// Header·BottomNav·채팅 목록이 같은 채팅방 구독을 각각 열지 않도록
// 앱 전체에서 한 번만 구독하고 결과를 공유한다.
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { chatRooms, isLoading: chatRoomsLoading, totalUnread } = useChatRooms(user?.uid);
  const notificationUnread = useUnreadNotificationCount(user?.uid);

  const value = useMemo(
    () => ({ chatRooms, chatRoomsLoading, totalUnread, notificationUnread }),
    [chatRooms, chatRoomsLoading, totalUnread, notificationUnread],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error("useAppData는 AppDataProvider 안에서만 사용할 수 있습니다");
  }
  return value;
}
