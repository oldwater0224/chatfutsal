import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { Application, RecruitPost } from "../../types";
import { db } from "../firebase";
import { buildNotification } from "./notificationService";
import { assertCanApply, assertPending, nextAcceptState } from "./applicationRules";

// 신청·수락·거절·취소는 모두 트랜잭션으로 처리한다.
// 모집글을 함께 읽고 쓰기 때문에 동시 요청이 겹치면 Firestore가 재시도하고,
// 재시도 시 최신 상태로 다시 검증되어 중복 신청이나 정원 초과가 막힌다.

// 참가 신청
export async function applyToPost(
  postId: string,
  postTitle: string,
  applicantId: string,
  applicantName: string,
  authorId: string,
  message: string,
): Promise<string> {
  const postRef = doc(db, "recruitPosts", postId);
  const appRef = doc(collection(db, "applications"));
  const notiRef = doc(collection(db, "notifications"));

  await runTransaction(db, async (tx) => {
    const postSnap = await tx.get(postRef);
    assertCanApply(postSnap.data() as RecruitPost | undefined, applicantId);

    tx.set(appRef, {
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
    tx.update(postRef, { applicantIds: arrayUnion(applicantId) });
    tx.set(
      notiRef,
      buildNotification(
        authorId,
        "application_received",
        `${applicantName}님이 참가 신청했어요`,
        postTitle,
        `/recruit/${postId}`,
      ),
    );
  });

  return appRef.id;
}

// 신청 취소 (pending 상태일 때만)
export async function cancelApplication(
  applicationId: string,
  postId: string,
  applicantId: string,
): Promise<void> {
  const appRef = doc(db, "applications", applicationId);
  const postRef = doc(db, "recruitPosts", postId);

  await runTransaction(db, async (tx) => {
    const appSnap = await tx.get(appRef);
    assertPending(appSnap.data() as Application | undefined);

    tx.delete(appRef);
    tx.update(postRef, { applicantIds: arrayRemove(applicantId) });
  });
}

// 신청 수락 (정원이 차면 자동 마감)
export async function acceptApplication(
  applicationId: string,
  postId: string,
): Promise<void> {
  const appRef = doc(db, "applications", applicationId);
  const postRef = doc(db, "recruitPosts", postId);
  const notiRef = doc(collection(db, "notifications"));

  await runTransaction(db, async (tx) => {
    const [appSnap, postSnap] = await Promise.all([tx.get(appRef), tx.get(postRef)]);
    const appData = appSnap.data() as Application | undefined;
    assertPending(appData);
    const { acceptedCount, shouldClose } = nextAcceptState(
      postSnap.data() as RecruitPost | undefined,
    );

    tx.update(appRef, { status: "accepted", updatedAt: serverTimestamp() });
    tx.update(postRef, {
      acceptedCount,
      ...(shouldClose && { status: "closed" }),
      updatedAt: serverTimestamp(),
    });
    tx.set(
      notiRef,
      buildNotification(
        appData!.applicantId,
        "application_accepted",
        "참가 신청이 수락되었어요!",
        appData!.postTitle,
        `/recruit/${postId}`,
      ),
    );
  });
}

// 신청 거절
export async function rejectApplication(
  applicationId: string,
  postId: string,
  applicantId: string,
): Promise<void> {
  const appRef = doc(db, "applications", applicationId);
  const postRef = doc(db, "recruitPosts", postId);
  const notiRef = doc(collection(db, "notifications"));

  await runTransaction(db, async (tx) => {
    const appSnap = await tx.get(appRef);
    const appData = appSnap.data() as Application | undefined;
    assertPending(appData);

    tx.update(appRef, { status: "rejected", updatedAt: serverTimestamp() });
    // 거절 시 applicantIds에서 제거 (재신청 가능)
    tx.update(postRef, { applicantIds: arrayRemove(applicantId) });
    tx.set(
      notiRef,
      buildNotification(
        applicantId,
        "application_rejected",
        "참가 신청이 거절되었어요",
        appData!.postTitle,
        `/recruit/${postId}`,
      ),
    );
  });
}
