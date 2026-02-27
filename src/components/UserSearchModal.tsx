"use client";

import { collection, getDocs, limit, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";

interface User {
  uid: string;
  displayName: string;
  email: string;
}
interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  currentUserId: string;
}

export default function UserSearchModal({
  isOpen,
  onClose,
  onSelectUser,
  currentUserId,
}: UserSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // modal 열릴때 전체 유저 불러오기
  useEffect(() => {
    if (!isOpen) return;

    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, limit(50));
        const snapshot = await getDocs(q);

        const userList: User[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // 본인 제외
          if (doc.id !== currentUserId) {
            userList.push({
              uid: doc.id,
              displayName: data.displayName || "사용자",
              email: data.email || "",
            });
          }
        });

        setAllUsers(userList);
        setUsers(userList);
      } catch (e) {
        console.error("유저 불러오기 실패:", e);
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [isOpen, currentUserId]);

  // 검색어로 필터링
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setUsers(allUsers);
    } else {
      const filtered = allUsers.filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setUsers(filtered);
    }
  }, [allUsers, searchTerm]);

  // modal이 닫히면 초기화
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setUsers([]);
      setAllUsers([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">새 채팅 시작</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>

          {/* 검색창 */}
          <input
            type="text"
            placeholder="닉네임 또는 이메일로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            autoFocus
          />
        </div>

        {/* 유저 목록 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <span className="text-3xl mb-2">🔍</span>
              <p>
                {searchTerm
                  ? "검색 결과가 없어요"
                  : "채팅할 수 있는 유저가 없어요"}
              </p>
              <p className="text-xs mt-2 text-gray-400">
                /seed 페이지에서 테스트 유저를 생성해보세요
              </p>
            </div>
          ) : (
            <ul>
              {users.map((user) => (
                <li key={user.uid}>
                  <button
                    onClick={() => onSelectUser(user)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-green-600 font-medium">
                        {user.displayName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
