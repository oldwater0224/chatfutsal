import { updateProfile, User as AuthUser } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { updateMyNameInChatRooms } from "./chatService";
import { validateDisplayName } from "./userRules";

// 닉네임은 Firestore users 문서와 Firebase Auth 프로필 두 곳에서 읽히므로 함께 바꾸고,
// 채팅방에 저장된 내 이름(participantNames)도 갱신한다.
// 그 밖에 복사된 이름(authorName, applicantName 등)은 갱신하지 않는다 (docs/features/프로필수정.md 5장)
export async function updateDisplayName(
  authUser: AuthUser,
  raw: string,
  current?: string | null,
): Promise<string> {
  const check = validateDisplayName(raw, current);
  if (!check.ok) {
    throw new Error(check.reason === "invalid" ? check.message : "변경된 내용이 없습니다.");
  }

  // 다른 사용자에게 보이는 원본인 Firestore를 먼저 쓴다
  await updateDoc(doc(db, "users", authUser.uid), { displayName: check.value });
  await updateProfile(authUser, { displayName: check.value });
  // 원본(users)은 이미 바뀌었으므로 채팅방 갱신 실패는 닉네임 변경 실패로 보지 않는다.
  // 반영되지 않은 방은 다음에 그 방에서 채팅을 시작할 때 바로잡힌다 (chatService.startChat)
  await updateMyNameInChatRooms(authUser.uid, check.value).catch((error) =>
    console.error("채팅방 이름 갱신 실패:", error),
  );

  return check.value;
}

// 다른 문서에 복사된 이름 대신 현재 닉네임이 필요할 때 쓴다 (예: 새 채팅방의 상대 이름)
export async function getDisplayName(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "users", uid));
  const name = snap.data()?.displayName;
  return typeof name === "string" && name ? name : null;
}
