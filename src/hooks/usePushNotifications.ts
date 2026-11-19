"use client";

import { useCallback, useEffect, useState } from "react";
import { disablePush, isPushOptedOut, isPushSupported, registerPushToken } from "../lib/services/pushService";

// docs/features/푸시알림.md 3-2
// off: 브라우저 권한은 허용됐지만 사용자가 이 기기에서 푸시를 끈 상태
export type PushStatus = "checking" | "unsupported" | "default" | "denied" | "enabled" | "off" | "error";

export function usePushNotifications(uid: string | undefined) {
  const [status, setStatus] = useState<PushStatus>("checking");
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  // 이미 허용된 사용자는 토큰이 바뀌었을 수 있으므로 다시 받아 저장한다
  // 단, 이 기기에서 푸시를 끈 사용자는 다시 등록하지 않는다 (새로고침으로 다시 켜지지 않게)
  const handleInitialCheck = useCallback(
    async (isActive: () => boolean) => {
      const supported = await isPushSupported();
      if (!isActive()) return;
      if (!supported) return setStatus("unsupported");

      const permission = Notification.permission;
      if (permission !== "granted") return setStatus(permission === "denied" ? "denied" : "default");
      if (isPushOptedOut()) return setStatus("off");
      if (!uid) return setStatus("default");

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

  // 사용자가 직접 눌렀을 때만 권한을 요청한다. "off"에서 다시 켤 때도 이 경로를 쓴다
  // (registerPushToken이 성공하면 "푸시 끔" 기록을 지운다)
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

  // 이 기기에서 푸시를 끈다. disablePush는 reject하지 않지만, 예상 밖 오류면 상태를 "enabled"로 둔다
  // (끄기 실패를 "error"로 바꾸면 켜기 버튼이 보여 실제 상태와 어긋난다)
  const disable = useCallback(async () => {
    setIsDisabling(true);
    try {
      await disablePush();
      setStatus("off");
    } catch (error) {
      console.error("푸시 알림 끄기 실패:", error);
      setStatus("enabled");
    } finally {
      setIsDisabling(false);
    }
  }, []);

  return { status, isEnabling, isDisabling, enable, disable };
}
