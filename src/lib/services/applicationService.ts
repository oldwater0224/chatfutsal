import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { Application, RecruitPost } from "../../types";
import { db } from "../firebase";
import { buildNotification } from "./notificationService";
import {
  assertCanApply,
  assertPending,
  nextAcceptState,
  pendingApplications,
} from "./applicationRules";
import { BatchOp, commitInChunks } from "./batchUtils";

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

  const closed = await runTransaction(db, async (tx) => {
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
    return shouldClose ? appData!.postTitle : null;
  });

  // 정원이 차서 마감됐으면 남은 대기 신청을 정리한다.
  // 마감 후에는 보안 규칙상 새 신청이 생기지 않으므로 트랜잭션 밖에서 처리해도 안전하다.
  if (closed !== null) await closePendingApplications(postId, closed);
}

// 모집 마감 (작성자)
// 모집글 마감과 대기 신청 정리를 같은 배치로 커밋한다.
export async function closeRecruitPostWithApplications(
  postId: string,
  postTitle: string,
): Promise<void> {
  await closePendingApplications(postId, postTitle, { closePost: true });
}

// 대기 중 신청을 "모집 마감"으로 바꾸고 신청자에게 알린다.
// applicantIds에서도 빼서 다시 모집할 때 재신청할 수 있게 한다.
async function closePendingApplications(
  postId: string,
  postTitle: string,
  { closePost = false } = {},
): Promise<void> {
  const snap = await getDocs(
    query(collection(db, "applications"), where("postId", "==", postId)),
  );
  const pending = pendingApplications(
    snap.docs.map((d) => ({ ref: d.ref, ...(d.data() as Application) })),
  );
  if (!closePost && pending.length === 0) return;

  const postRef = doc(db, "recruitPosts", postId);
  const applicantIds = pending.map((app) => app.applicantId);

  const ops: BatchOp[] = [
    (batch) =>
      batch.update(postRef, {
        ...(closePost && { status: "closed" }),
        ...(applicantIds.length > 0 && { applicantIds: arrayRemove(...applicantIds) }),
        updatedAt: serverTimestamp(),
      }),
    ...pending.flatMap((app): BatchOp[] => [
      (batch) => batch.update(app.ref, { status: "closed", updatedAt: serverTimestamp() }),
      (batch) =>
        batch.set(
          doc(collection(db, "notifications")),
          buildNotification(
            app.applicantId,
            "recruit_closed",
            "모집이 마감되었어요",
            postTitle,
            `/recruit/${postId}`,
          ),
        ),
    ]),
  ];

  await commitInChunks(ops);
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
