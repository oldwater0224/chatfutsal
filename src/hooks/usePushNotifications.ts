"use client";

import { useCallback, useEffect, useState } from "react";
import { isPushSupported, registerPushToken } from "../lib/services/pushService";

// docs/features/푸시알림.md 3-2
export type PushStatus = "checking" | "unsupported" | "default" | "denied" | "enabled" | "error";

export function usePushNotifications(uid: string | undefined) {
  const [status, setStatus] = useState<PushStatus>("checking");
  const [isEnabling, setIsEnabling] = useState(false);

  // 이미 허용된 사용자는 토큰이 바뀌었을 수 있으므로 다시 받아 저장한다
  const handleInitialCheck = useCallback(
    async (isActive: () => boolean) => {
      const supported = await isPushSupported();
      if (!isActive()) return;
      if (!supported) return setStatus("unsupported");

      const permission = Notification.permission;
      if (permission !== "granted" || !uid) return setStatus(permission === "denied" ? "denied" : "default");

      try {
        await registerPushToken(uid);
        if (isActive()) setStatus("enabled");
      } catch (error) {
        console.error("푸시 토큰 갱신 실패:", error);
        if (isActive()) setStatus("error");
      }
    },
    [uid],
  );

  useEffect(() => {
    let active = true;
    handleInitialCheck(() => active);
    return () => {
      active = false;
    };
  }, [handleInitialCheck]);

  // 사용자가 직접 눌렀을 때만 권한을 요청한다
  const enable = useCallback(async () => {
    if (!uid) return;
    setIsEnabling(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        return;
      }
      await registerPushToken(uid);
      setStatus("enabled");
    } catch (error) {
      console.error("푸시 알림 설정 실패:", error);
      setStatus("error");
    } finally {
      setIsEnabling(false);
    }
  }, [uid]);

  return { status, isEnabling, enable };
}
