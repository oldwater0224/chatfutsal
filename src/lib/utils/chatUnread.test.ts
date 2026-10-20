import { describe, it, expect } from "vitest";
import { countUnread, sumUnread, type MessageDocLike } from "./chatUnread";

const ME = "me";
const OTHER = "other";

function msg(data: {
  senderId?: string;
  readBy?: string[];
  createdAt?: Date;
}): MessageDocLike {
  return {
    data: () => ({
      senderId: data.senderId,
      readBy: data.readBy,
      createdAt: data.createdAt ? { toDate: () => data.createdAt! } : undefined,
    }),
  };
}

describe("countUnread", () => {
  it("빈 목록은 0", () => {
    expect(countUnread([], ME, undefined)).toBe(0);
  });

  it("상대가 보낸 안 읽은 메시지를 센다", () => {
    const docs = [msg({ senderId: OTHER }), msg({ senderId: OTHER })];
    expect(countUnread(docs, ME, undefined)).toBe(2);
  });

  it("내가 보낸 메시지는 제외한다", () => {
    const docs = [msg({ senderId: ME }), msg({ senderId: OTHER })];
    expect(countUnread(docs, ME, undefined)).toBe(1);
  });

  it("이미 읽은 메시지는 제외한다", () => {
    const docs = [
      msg({ senderId: OTHER, readBy: [ME] }),
      msg({ senderId: OTHER, readBy: [] }),
    ];
    expect(countUnread(docs, ME, undefined)).toBe(1);
  });

  it("다른 사람만 읽은 메시지는 센다", () => {
    const docs = [msg({ senderId: OTHER, readBy: ["someoneElse"] })];
    expect(countUnread(docs, ME, undefined)).toBe(1);
  });

  it("readBy가 없어도 안 읽음으로 센다", () => {
    expect(countUnread([msg({ senderId: OTHER })], ME, undefined)).toBe(1);
  });

  describe("나가기 시각(myLeftAt)이 있을 때", () => {
    const leftAt = new Date("2026-10-20T12:00:00");

    it("나가기 전 메시지는 제외한다", () => {
      const docs = [msg({ senderId: OTHER, createdAt: new Date("2026-10-20T11:59:00") })];
      expect(countUnread(docs, ME, leftAt)).toBe(0);
    });

    it("나가기 후 메시지는 센다", () => {
      const docs = [msg({ senderId: OTHER, createdAt: new Date("2026-10-20T12:01:00") })];
      expect(countUnread(docs, ME, leftAt)).toBe(1);
    });

    it("나가기 시각과 같은 메시지는 제외한다 (경계)", () => {
      const docs = [msg({ senderId: OTHER, createdAt: leftAt })];
      expect(countUnread(docs, ME, leftAt)).toBe(0);
    });

    it("나가기 전후가 섞이면 이후만 센다", () => {
      const docs = [
        msg({ senderId: OTHER, createdAt: new Date("2026-10-20T11:00:00") }),
        msg({ senderId: OTHER, createdAt: new Date("2026-10-20T13:00:00") }),
        msg({ senderId: OTHER, createdAt: new Date("2026-10-20T14:00:00") }),
      ];
      expect(countUnread(docs, ME, leftAt)).toBe(2);
    });

    it("나가기 후라도 내가 보낸 메시지는 제외한다", () => {
      const docs = [msg({ senderId: ME, createdAt: new Date("2026-10-20T13:00:00") })];
      expect(countUnread(docs, ME, leftAt)).toBe(0);
    });
  });
});

describe("sumUnread", () => {
  it("빈 목록은 0", () => {
    expect(sumUnread([])).toBe(0);
  });

  it("방별 안 읽은 수를 합산한다", () => {
    expect(sumUnread([{ unreadCount: 3 }, { unreadCount: 0 }, { unreadCount: 2 }])).toBe(5);
  });
});
