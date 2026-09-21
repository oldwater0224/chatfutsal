"use client";

import { useCallback, useEffect, useState } from "react";
import { Message } from "../types";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  QuerySnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { createNotification } from "../lib/services/notificationService";

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(!!roomId);

  const handleSnapshot = useCallback((snapshot: QuerySnapshot) => {
    const msgs: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        senderName: data.senderName,
        text: data.text,
        createdAt: data.createdAt?.toDate() || new Date(),
        readBy: data.readBy || [],
      };
    });
    setMessages(msgs);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error("메시지 조회 에러:", error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, handleSnapshot, handleError);
    return () => unsubscribe();
  }, [roomId, handleSnapshot, handleError]);

  return { messages, isLoading };
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
      await createNotification(
        recipientId,
        "new_message",
        `${senderName}님의 새 메시지`,
        text.length > 50 ? text.slice(0, 50) + "..." : text,
        `/chat/${roomId}`,
      );
    }
  }
}
