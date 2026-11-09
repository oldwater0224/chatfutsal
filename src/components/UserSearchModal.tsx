"use client";

import { collection, getDocs, limit, query } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { ChevronRight, SearchX, X } from "lucide-react";
import { db } from "../lib/firebase";
import {
  avatarClass,
  emptyIconTileClass,
  focusRingInsetClass,
  iconButtonClass,
  searchInputClass,
  spinnerClass,
} from "./ui/styles";

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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  //  유저 불러오기 함수
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, limit(50));
      const snapshot = await getDocs(q);

      const userList: User[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== currentUserId) {
          userList.push({
            uid: doc.id,
            displayName: data.displayName || "사용자",
            email: data.email || "",
          });
        }
      });

      setAllUsers(userList);
    } catch (e) {
      console.error("유저 불러오기 실패:", e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  //  모달 열릴 때 유저 불러오기
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

  //  검색어 필터링 - state 대신 계산된 값 사용
  const filteredUsers =
    searchTerm.trim() === ""
      ? allUsers
      : allUsers.filter(
          (user) =>
            user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()),
        );

  //  모달 닫기 - 이벤트 핸들러에서 초기화
  const handleClose = () => {
    setSearchTerm("");
    setAllUsers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden="true" />

      {/* 모달 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-search-title"
        className="relative w-full max-w-lg bg-white rounded-t-2xl max-h-[80vh] flex flex-col"
      >
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 id="user-search-title" className="text-[17px] font-semibold text-gray-900">
              새 채팅 시작
            </h2>
            <button onClick={handleClose} aria-label="닫기" className={`-mr-2 ${iconButtonClass}`}>
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* 검색창 */}
          <input
            type="text"
            placeholder="닉네임 또는 이메일로 검색"
            aria-label="닉네임 또는 이메일로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${searchInputClass} h-10 px-4`}
            autoFocus
          />
        </div>

        {/* 유저 목록 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className={spinnerClass} role="status" aria-label="불러오는 중" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className={emptyIconTileClass}>
                <SearchX className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-[15px] text-gray-600">
                {searchTerm
                  ? "검색 결과가 없어요"
                  : "채팅할 수 있는 유저가 없어요"}
              </p>
            </div>
          ) : (
            <ul>
              {filteredUsers.map((user) => (
                <li key={user.uid}>
                  <button
                    onClick={() => onSelectUser(user)}
                    className={`w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 cursor-pointer transition-colors ${focusRingInsetClass}`}
                  >
                    <span className={`w-10 h-10 text-[15px] ${avatarClass}`} aria-hidden="true">
                      {user.displayName.charAt(0)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-medium text-gray-900 truncate">
                        {user.displayName}
                      </span>
                      <span className="block mt-1 text-[13px] text-gray-600 truncate">
                        {user.email}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-gray-400" aria-hidden="true" />
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
