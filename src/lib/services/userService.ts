import { updateProfile, User as AuthUser } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { validateDisplayName } from "./userRules";

// 닉네임은 Firestore users 문서와 Firebase Auth 프로필 두 곳에서 읽히므로 함께 바꾼다
// 이미 다른 문서에 복사된 이름(authorName, applicantName 등)은 갱신하지 않는다 (docs/features/프로필수정.md 5장)
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

  return check.value;
}
