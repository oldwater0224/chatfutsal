import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Application, RecruitPost } from "../../types";
import { db } from "../firebase";
import { applicantsToNotifyOnDelete, assertCanReopen } from "./applicationRules";
import { BatchOp, commitInChunks } from "./batchUtils";
import { buildNotification } from "./notificationService";
import { requestPush } from "./pushService";
import { nameForCopy } from "./userRules";

// 게시글 생성
// authorName은 호출자가 넘긴 값 대신 users 문서의 현재 닉네임(없으면 '사용자')을 저장한다.
// 보안 규칙이 이 두 값만 허용하므로, 화면의 오래된 userData나 Auth 프로필 이름으로 저장하다 거부되지 않게 한다.
// 인자는 기존 호출부 호환을 위해 남겨 두었고 쓰지 않는다.
export async function createRecruitPost(
  authorId: string,
  _authorName: string,
  postData: {
    title: string;
    content: string;
    date: string;
    time: string;
    location: string;
    locationCoord : {
      lat : number;
      lng : number;
      address : string;
    };
    level: string;
    needCount: number;
  },
): Promise<string> {
  const author = await getDoc(doc(db, "users", authorId));
  const docRef = await addDoc(collection(db, "recruitPosts"), {
    authorId,
    authorName: nameForCopy(author.data()?.displayName),
    ...postData,
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}
// 게시글 수정
export async function updateRecruitPost(
  postId: string,
  postData: Partial<RecruitPost>
): Promise<void> {
  const postRef = doc(db, 'recruitPosts', postId);
  await updateDoc(postRef, {
    ...postData,
    updatedAt: serverTimestamp(),
  });
}

// 게시글 삭제
// 연관 신청 문서를 함께 지우고, 대기·수락 상태였던 신청자에게 취소 알림을 보낸다.
// 보안 규칙은 모집글이 삭제된 뒤(같은 배치 포함)에만 작성자의 신청 문서 삭제를 허용하므로
// 모집글 삭제를 첫 배치에 넣는다.
export async function deleteRecruitPost(postId: string, postTitle: string): Promise<void> {
  const appsSnap = await getDocs(
    query(collection(db, "applications"), where("postId", "==", postId)),
  );
  const apps = appsSnap.docs.map((d) => d.data() as Application);
  const notifyIds = applicantsToNotifyOnDelete(apps);
  const notiRefs = notifyIds.map(() => doc(collection(db, "notifications")));

  const ops: BatchOp[] = [
    (batch) => batch.delete(doc(db, "recruitPosts", postId)),
    ...appsSnap.docs.map((d): BatchOp => (batch) => batch.delete(d.ref)),
    ...notifyIds.map((applicantId, i): BatchOp => (batch) =>
      batch.set(
        notiRefs[i],
        buildNotification(applicantId, "recruit_deleted", "모집이 취소되었어요", postTitle, "/"),
      ),
    ),
  ];

  await commitInChunks(ops);
  requestPush(notiRefs.map((ref) => ref.id));
}

// 모집 마감
export async function closeRecruitPost(postId : string) : Promise<void>{
  const postRef = doc(db, 'recruitPosts' , postId);
  await updateDoc(postRef , {
    status : 'closed',
    updatedAt : serverTimestamp(),
  });
}
// 모집 재오픈 (정원이 찼거나 경기 시간이 지난 글은 불가)
export async function reopenRecruitPost(postId: string): Promise<void> {
  const postRef = doc(db, "recruitPosts", postId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(postRef);
    assertCanReopen(snap.data() as RecruitPost | undefined);
    tx.update(postRef, { status: "open", updatedAt: serverTimestamp() });
  });
}
