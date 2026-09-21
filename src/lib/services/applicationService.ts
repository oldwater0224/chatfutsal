import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { createNotification } from "./notificationService";

// 참가 신청
export async function applyToPost(
  postId: string,
  postTitle: string,
  applicantId: string,
  applicantName: string,
  authorId: string,
  message: string,
): Promise<string> {
  const docRef = await addDoc(collection(db, "applications"), {
    postId,
    postTitle,
    applicantId,
    applicantName,
    authorId,
    message,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 모집글에 신청자 ID 추가
  const postRef = doc(db, "recruitPosts", postId);
  await updateDoc(postRef, {
    applicantIds: arrayUnion(applicantId),
  });

  await createNotification(
    authorId,
    "application_received",
    `${applicantName}님이 참가 신청했어요`,
    postTitle,
    `/recruit/${postId}`,
  );

  return docRef.id;
}

// 신청 취소 (pending 상태일 때만)
export async function cancelApplication(
  applicationId: string,
  postId: string,
  applicantId: string,
): Promise<void> {
  await deleteDoc(doc(db, "applications", applicationId));

  const postRef = doc(db, "recruitPosts", postId);
  await updateDoc(postRef, {
    applicantIds: arrayRemove(applicantId),
  });
}

// 신청 수락
export async function acceptApplication(
  applicationId: string,
  postId: string,
  needCount: number,
): Promise<void> {
  const appRef = doc(db, "applications", applicationId);
  const appSnap = await getDoc(appRef);
  const appData = appSnap.data();

  await updateDoc(appRef, {
    status: "accepted",
    updatedAt: serverTimestamp(),
  });

  const postRef = doc(db, "recruitPosts", postId);
  await updateDoc(postRef, {
    acceptedCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  if (appData) {
    await createNotification(
      appData.applicantId,
      "application_accepted",
      "참가 신청이 수락되었어요!",
      appData.postTitle,
      `/recruit/${postId}`,
    );
  }

  // 수락 후 정원이 찼는지 확인 → 자동 마감
  const appsQuery = query(
    collection(db, "applications"),
    where("postId", "==", postId),
    where("status", "==", "accepted"),
  );
  const snapshot = await getDocs(appsQuery);

  if (snapshot.size >= needCount) {
    await updateDoc(postRef, {
      status: "closed",
      updatedAt: serverTimestamp(),
    });
  }
}

// 신청 거절
export async function rejectApplication(
  applicationId: string,
  postId: string,
  applicantId: string,
): Promise<void> {
  const appRef = doc(db, "applications", applicationId);
  const appSnap = await getDoc(appRef);
  const appData = appSnap.data();

  await updateDoc(appRef, {
    status: "rejected",
    updatedAt: serverTimestamp(),
  });

  // 거절 시 applicantIds에서 제거 (재신청 가능)
  const postRef = doc(db, "recruitPosts", postId);
  await updateDoc(postRef, {
    applicantIds: arrayRemove(applicantId),
  });

  if (appData) {
    await createNotification(
      applicantId,
      "application_rejected",
      "참가 신청이 거절되었어요",
      appData.postTitle,
      `/recruit/${postId}`,
    );
  }
}
