// 안 읽은 메시지 수 계산. Firestore에 의존하지 않도록 구조적 타입만 받는다
// (QueryDocumentSnapshot[]을 그대로 넘길 수 있고, 테스트에서는 가짜 문서를 넘긴다).

interface MessageDocData {
  senderId?: string;
  readBy?: string[];
  createdAt?: { toDate: () => Date };
}

export interface MessageDocLike {
  data: () => MessageDocData;
}

// 내가 보낸 메시지와 나가기 전 메시지는 제외한다.
export function countUnread(
  docs: MessageDocLike[],
  userId: string,
  myLeftAt: Date | undefined,
): number {
  return docs.filter((msgDoc) => {
    const msgData = msgDoc.data();
    const readBy = msgData.readBy || [];
    if (myLeftAt) {
      const createdAt: Date = msgData.createdAt?.toDate() || new Date();
      if (createdAt.getTime() <= myLeftAt.getTime()) return false;
    }
    return msgData.senderId !== userId && !readBy.includes(userId);
  }).length;
}

// 채팅방별 안 읽은 수의 합 (하단 네비게이션 배지)
export function sumUnread(rooms: { unreadCount: number }[]): number {
  return rooms.reduce((sum, room) => sum + room.unreadCount, 0);
}
