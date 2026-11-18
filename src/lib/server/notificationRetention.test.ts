import { describe, expect, it } from "vitest";
import { NOTIFICATION_RETENTION_DAYS, notificationCutoff } from "./notificationRetention";

describe("notificationCutoff", () => {
  it("기본 보관 기간은 90일이다", () => {
    expect(NOTIFICATION_RETENTION_DAYS).toBe(90);
    expect(notificationCutoff(new Date("2026-11-18T00:00:00Z")).toISOString()).toBe(
      "2026-08-20T00:00:00.000Z",
    );
  });

  it("보관 일수를 바꿀 수 있다", () => {
    expect(notificationCutoff(new Date("2026-11-18T12:34:56Z"), 1).toISOString()).toBe(
      "2026-11-17T12:34:56.000Z",
    );
  });
});
