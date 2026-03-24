import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { RecruitPost } from "../../types";
import { db } from "../firebase";

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
export async function deleteRecruitPost(postId:string) : Promise<void> {
  await deleteDoc(doc(db , 'recruitPosts' , postId));
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
