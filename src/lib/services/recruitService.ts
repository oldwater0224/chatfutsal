import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  WriteBatch,
} from "firebase/firestore";
import { Application, RecruitPost } from "../../types";
import { db } from "../firebase";
import { applicantsToNotifyOnDelete } from "./applicationRules";
import { buildNotification } from "./notificationService";

// 게시글 생성
export async function createRecruitPost(
  authorId: string,
  authorName: string,
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
  const docRef = await addDoc(collection(db, "recruitPosts"), {
    authorId,
    authorName,
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

  const ops: ((batch: WriteBatch) => void)[] = [
    (batch) => batch.delete(doc(db, "recruitPosts", postId)),
    ...appsSnap.docs.map((d) => (batch: WriteBatch) => batch.delete(d.ref)),
    ...applicantsToNotifyOnDelete(apps).map((applicantId) => (batch: WriteBatch) =>
      batch.set(
        doc(collection(db, "notifications")),
        buildNotification(applicantId, "recruit_deleted", "모집이 취소되었어요", postTitle, "/"),
      ),
    ),
  ];

  // writeBatch는 한 번에 최대 500개 작업까지 가능하므로 나눠서 커밋
  const BATCH_LIMIT = 500;
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    ops.slice(i, i + BATCH_LIMIT).forEach((op) => op(batch));
    await batch.commit();
  }
}

// 모집 마감
export async function closeRecruitPost(postId : string) : Promise<void>{
  const postRef = doc(db, 'recruitPosts' , postId);
  await updateDoc(postRef , {
    status : 'closed',
    updatedAt : serverTimestamp(),
  });
}
// 모집 재오픈
export async function reopenRecruitPost(postId : string) : Promise<void>{
  const postRef = doc(db, 'recruitPosts' , postId);
  await updateDoc(postRef , {
    status : 'open',
    updatedAt : serverTimestamp(),
  });
}
