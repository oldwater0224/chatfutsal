"use client";

import { useEffect, useState } from "react";
import { Message } from "../types";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(!!roomId);

  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    });

    return () => unsubscribe();
  }, [roomId]);

  return { messages, isLoading };
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  text: string,
) {
  // 메세지 추가
  const messagesRef = collection(db, "chatRooms", roomId, "messages");
  await addDoc(messagesRef, {
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
    readBy: [senderId],
  });

  //채팅방 lastMessage 업데이트
  const chatRoomRef = doc(db , 'chatRooms' , roomId);
  await updateDoc(chatRoomRef , {
    lastMessage : text , 
    lastMessageAt : serverTimestamp(),
  });


}
