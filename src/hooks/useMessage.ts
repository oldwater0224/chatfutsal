"use client";

import { useMemo } from "react";
import { Message } from "../types";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { createNotification } from "../lib/services/notificationService";
import { requestPush } from "../lib/services/pushService";
import { useLivePagedQuery } from "./useLivePagedQuery";

const PAGE_SIZE = 50;

// 최근 PAGE_SIZE개는 실시간, 이전 메시지는 "이전 메시지 보기"로 한 번씩 읽는다.
// 최신순으로 받아 화면에는 오래된 순으로 뒤집어 보여준다.
export function useMessages(roomId: string) {
  const buildQuery = useMemo(
    () =>
      roomId
        ? () => query(collection(db, "chatRooms", roomId, "messages"), orderBy("createdAt", "desc"))
        : null,
    [roomId],
  );
  const { docs, canLoadMore, loadMore, isLoading } = useLivePagedQuery(buildQuery, PAGE_SIZE, "메시지");

  const messages = useMemo(
    () =>
      docs
        .map((doc): Message => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            createdAt: data.createdAt?.toDate() || new Date(),
            readBy: data.readBy || [],
          };
        })
        .reverse(),
    [docs],
  );

  return { messages, isLoading, hasMore: canLoadMore, loadMore };
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  text: string,
) {
  const messagesRef = collection(db, "chatRooms", roomId, "messages");
  await addDoc(messagesRef, {
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
    readBy: [senderId],
  });

  const chatRoomRef = doc(db, "chatRooms", roomId);
  await updateDoc(chatRoomRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  });

  const roomSnap = await getDoc(chatRoomRef);
  if (roomSnap.exists()) {
    const participants: string[] = roomSnap.data().participants || [];
    const recipientId = participants.find((id) => id !== senderId);
    if (recipientId) {
      const notificationId = await createNotification(
        recipientId,
        "new_message",
        `${senderName}님의 새 메시지`,
        text.length > 50 ? text.slice(0, 50) + "..." : text,
        `/chat/${roomId}`,
      );
      requestPush([notificationId]);
    }
  }
}
