import { readFileSync } from 'fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  limit,
  limitToLast,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

let env: RulesTestEnvironment;

const AUTHOR = 'alice';
const APPLICANT = 'bob';
const OTHER = 'carol';

const db = (uid?: string) =>
  (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore() as unknown as Firestore;

const futurePost = {
  authorId: AUTHOR,
  authorName: 'Alice',
  title: '주말 풋살',
  content: '',
  date: '2099-01-01',
  time: '18:00',
  location: '',
  level: 'amateur',
  needCount: 2,
  acceptedCount: 0,
  applicantIds: [] as string[],
  status: 'open',
};

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, path), data);
  });
}

const notification = (recipientId: string) => ({
  recipientId,
  type: 'application_received',
  title: 't',
  body: 'b',
  link: '/',
  isRead: false,
  createdAt: serverTimestamp(),
});

// applicationService.applyToPost와 같은 형태의 트랜잭션
async function apply(uid: string, postId = 'p1') {
  const f = db(uid);
  const postRef = doc(f, 'recruitPosts', postId);
  await runTransaction(f, async (tx) => {
    await tx.get(postRef);
    tx.set(doc(collection(f, 'applications')), {
      postId,
      postTitle: '주말 풋살',
      applicantId: uid,
      applicantName: uid,
      authorId: AUTHOR,
      message: '',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    tx.update(postRef, { applicantIds: arrayUnion(uid) });
    tx.set(doc(collection(f, 'notifications')), notification(AUTHOR));
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-chatfutsal',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed('recruitPosts/p1', futurePost);
});

describe('기본 거부', () => {
  it('비로그인 사용자는 모집글을 읽을 수 없다', async () => {
    await assertFails(getDoc(doc(db(), 'recruitPosts/p1')));
  });

  it('규칙에 없는 컬렉션은 로그인해도 접근 불가', async () => {
    await assertFails(setDoc(doc(db(OTHER), 'anything/x'), { a: 1 }));
  });
});

describe('users', () => {
  it('본인 문서만 쓸 수 있다', async () => {
    await assertSucceeds(setDoc(doc(db(APPLICANT), 'users', APPLICANT), { displayName: 'Bob' }));
    await assertFails(setDoc(doc(db(OTHER), 'users', APPLICANT), { displayName: 'hack' }));
  });

  describe('fcmTokens', () => {
    const TOKEN = 'fcm-token:abc_123';
    const tokenPath = (uid: string) => `users/${uid}/fcmTokens/${TOKEN}`;

    it('본인은 토큰을 저장·조회·삭제할 수 있다', async () => {
      const ref = doc(db(APPLICANT), tokenPath(APPLICANT));
      await assertSucceeds(setDoc(ref, { token: TOKEN, updatedAt: serverTimestamp() }));
      await assertSucceeds(getDoc(ref));
      await assertSucceeds(deleteDoc(ref));
    });

    it('다른 사람의 토큰은 읽거나 쓸 수 없다', async () => {
      await seed(tokenPath(APPLICANT), { token: TOKEN, updatedAt: new Date() });
      await assertFails(getDoc(doc(db(OTHER), tokenPath(APPLICANT))));
      await assertFails(getDocs(collection(db(OTHER), `users/${APPLICANT}/fcmTokens`)));
      await assertFails(deleteDoc(doc(db(OTHER), tokenPath(APPLICANT))));
      await assertFails(
        setDoc(doc(db(OTHER), `users/${APPLICANT}/fcmTokens/other`), { token: 'other', updatedAt: new Date() }),
      );
    });

    it('문서 ID와 token이 다르거나 다른 필드가 있으면 거부', async () => {
      await assertFails(
        setDoc(doc(db(APPLICANT), tokenPath(APPLICANT)), { token: 'different', updatedAt: new Date() }),
      );
      await assertFails(
        setDoc(doc(db(APPLICANT), tokenPath(APPLICANT)), { token: TOKEN, updatedAt: new Date(), extra: 1 }),
      );
    });
  });
});

describe('recruitPosts', () => {
  it('모집 중인 글을 페이지 단위로 조회할 수 있다', async () => {
    await assertSucceeds(
      getDocs(
        query(collection(db(OTHER), 'recruitPosts'), where('status', '==', 'open'), orderBy('createdAt', 'desc'), limit(20)),
      ),
    );
  });

  it('날짜·실력 필터를 쿼리로 건 목록 조회가 허용된다', async () => {
    await assertSucceeds(
      getDocs(
        query(
          collection(db(OTHER), 'recruitPosts'),
          where('status', '==', 'open'),
          where('date', '==', '2099-01-01'),
          where('level', '==', 'amateur'),
          orderBy('createdAt', 'desc'),
          limit(20),
        ),
      ),
    );
  });

  it('본인 명의로만 글을 작성할 수 있다', async () => {
    await assertSucceeds(setDoc(doc(db(AUTHOR), 'recruitPosts/p2'), futurePost));
    await assertFails(setDoc(doc(db(OTHER), 'recruitPosts/p3'), futurePost));
  });

  it('작성자가 아니면 수정·삭제할 수 없다', async () => {
    await assertSucceeds(updateDoc(doc(db(AUTHOR), 'recruitPosts/p1'), { title: '수정' }));
    await assertFails(updateDoc(doc(db(OTHER), 'recruitPosts/p1'), { acceptedCount: 99 }));
    await assertFails(updateDoc(doc(db(OTHER), 'recruitPosts/p1'), { status: 'closed' }));
    await assertFails(deleteDoc(doc(db(OTHER), 'recruitPosts/p1')));
  });

  it('applicantIds에 다른 사람을 넣거나 뺄 수 없다', async () => {
    await seed('recruitPosts/p1', { ...futurePost, applicantIds: [APPLICANT] });
    await assertFails(updateDoc(doc(db(OTHER), 'recruitPosts/p1'), { applicantIds: arrayUnion('dave') }));
    await assertFails(updateDoc(doc(db(OTHER), 'recruitPosts/p1'), { applicantIds: arrayRemove(APPLICANT) }));
  });

  it('경기 시간이 지난 글은 누구나 마감할 수 있다', async () => {
    await seed('recruitPosts/old', { ...futurePost, date: '2020-01-01' });
    await assertSucceeds(
      updateDoc(doc(db(OTHER), 'recruitPosts/old'), { status: 'closed', updatedAt: serverTimestamp() }),
    );
  });
});

describe('applications', () => {
  it('트랜잭션으로 신청할 수 있다', async () => {
    await assertSucceeds(apply(APPLICANT));
  });

  it('같은 글에 중복 신청할 수 없다', async () => {
    await apply(APPLICANT);
    await assertFails(apply(APPLICANT));
  });

  it('applicantIds 갱신 없이 신청 문서만 만들 수 없다', async () => {
    await assertFails(
      setDoc(doc(db(APPLICANT), 'applications/a1'), {
        postId: 'p1', postTitle: '', applicantId: APPLICANT, applicantName: '',
        authorId: AUTHOR, message: '', status: 'pending',
      }),
    );
  });

  it('마감된 글, 본인 글에는 신청할 수 없다', async () => {
    await seed('recruitPosts/p1', { ...futurePost, status: 'closed' });
    await assertFails(apply(APPLICANT));
    await seed('recruitPosts/p1', futurePost);
    await assertFails(apply(AUTHOR));
  });

  describe('대기 중인 신청', () => {
    beforeEach(async () => {
      await seed('recruitPosts/p1', { ...futurePost, applicantIds: [APPLICANT] });
      await seed('applications/a1', {
        postId: 'p1', postTitle: '', applicantId: APPLICANT, applicantName: '',
        authorId: AUTHOR, message: '', status: 'pending',
      });
    });

    it('작성자는 수락할 수 있고 다른 사람은 못 한다', async () => {
      await assertFails(updateDoc(doc(db(APPLICANT), 'applications/a1'), { status: 'accepted' }));
      const f = db(AUTHOR);
      await assertSucceeds(
        runTransaction(f, async (tx) => {
          await tx.get(doc(f, 'applications/a1'));
          tx.update(doc(f, 'applications/a1'), { status: 'accepted', updatedAt: serverTimestamp() });
          tx.update(doc(f, 'recruitPosts/p1'), { acceptedCount: 1, updatedAt: serverTimestamp() });
          tx.set(doc(collection(f, 'notifications')), notification(APPLICANT));
        }),
      );
    });

    it('신청자는 취소할 수 있고 다른 사람은 못 한다', async () => {
      await assertFails(deleteDoc(doc(db(OTHER), 'applications/a1')));
      const f = db(APPLICANT);
      const batch = writeBatch(f);
      batch.delete(doc(f, 'applications/a1'));
      batch.update(doc(f, 'recruitPosts/p1'), { applicantIds: arrayRemove(APPLICANT) });
      await assertSucceeds(batch.commit());
    });

    it('작성자는 모집글과 함께 신청을 삭제하고 취소 알림을 보낼 수 있다', async () => {
      const f = db(AUTHOR);
      const batch = writeBatch(f);
      batch.delete(doc(f, 'recruitPosts/p1'));
      batch.delete(doc(f, 'applications/a1'));
      batch.set(doc(collection(f, 'notifications')), { ...notification(APPLICANT), type: 'recruit_deleted' });
      await assertSucceeds(batch.commit());
    });

    it('모집글을 남겨둔 채 작성자가 신청만 삭제할 수는 없다', async () => {
      await assertFails(deleteDoc(doc(db(AUTHOR), 'applications/a1')));
    });

    it('다른 사람은 모집글이 없어도 신청을 삭제할 수 없다', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await deleteDoc(doc(ctx.firestore() as unknown as Firestore, 'recruitPosts/p1'));
      });
      await assertFails(deleteDoc(doc(db(OTHER), 'applications/a1')));
    });

    it('작성자는 마감하면서 대기 신청을 모집 마감 처리할 수 있다', async () => {
      const f = db(AUTHOR);
      const batch = writeBatch(f);
      batch.update(doc(f, 'recruitPosts/p1'), {
        status: 'closed',
        applicantIds: arrayRemove(APPLICANT),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(f, 'applications/a1'), { status: 'closed', updatedAt: serverTimestamp() });
      batch.set(doc(collection(f, 'notifications')), { ...notification(APPLICANT), type: 'recruit_closed' });
      await assertSucceeds(batch.commit());
    });

    it('신청자는 자기 신청을 모집 마감 상태로 바꿀 수 없다', async () => {
      await assertFails(updateDoc(doc(db(APPLICANT), 'applications/a1'), { status: 'closed' }));
    });

    // 경기 시간 경과로 이미 마감된 글의 뒤늦은 정리(closePendingApplications의 closePost=false 경로).
    // 모집글에는 status 없이 applicantIds와 updatedAt만 쓴다.
    it('작성자는 이미 마감된 글의 대기 신청을 뒤늦게 정리할 수 있다', async () => {
      await seed('recruitPosts/p1', {
        ...futurePost,
        date: '2020-01-01',
        status: 'closed',
        applicantIds: [APPLICANT],
      });

      const f = db(AUTHOR);
      const batch = writeBatch(f);
      batch.update(doc(f, 'recruitPosts/p1'), {
        applicantIds: arrayRemove(APPLICANT),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(f, 'applications/a1'), { status: 'closed', updatedAt: serverTimestamp() });
      batch.set(doc(collection(f, 'notifications')), { ...notification(APPLICANT), type: 'recruit_closed' });
      await assertSucceeds(batch.commit());
    });

    it('작성자가 아니면 마감된 글의 대기 신청을 정리할 수 없다', async () => {
      await seed('recruitPosts/p1', {
        ...futurePost,
        date: '2020-01-01',
        status: 'closed',
        applicantIds: [APPLICANT],
      });

      await assertFails(
        updateDoc(doc(db(OTHER), 'applications/a1'), {
          status: 'closed',
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('처리된 신청은 취소·재처리할 수 없다', async () => {
      await seed('applications/a1', {
        postId: 'p1', postTitle: '', applicantId: APPLICANT, applicantName: '',
        authorId: AUTHOR, message: '', status: 'accepted',
      });
      await assertFails(deleteDoc(doc(db(APPLICANT), 'applications/a1')));
      await assertFails(updateDoc(doc(db(AUTHOR), 'applications/a1'), { status: 'rejected' }));
    });
  });
});

describe('notifications', () => {
  beforeEach(async () => {
    await seed('notifications/n1', { ...notification(APPLICANT), createdAt: null });
  });

  it('받는 사람만 읽고 읽음 처리할 수 있다', async () => {
    await assertSucceeds(getDoc(doc(db(APPLICANT), 'notifications/n1')));
    await assertSucceeds(
      getDocs(query(collection(db(APPLICANT), 'notifications'), where('recipientId', '==', APPLICANT))),
    );
    await assertSucceeds(updateDoc(doc(db(APPLICANT), 'notifications/n1'), { isRead: true }));
    await assertFails(getDoc(doc(db(OTHER), 'notifications/n1')));
    await assertFails(updateDoc(doc(db(OTHER), 'notifications/n1'), { isRead: true }));
  });

  it('페이지 단위 목록·안 읽은 수 쿼리가 허용된다', async () => {
    const f = db(APPLICANT);
    await assertSucceeds(
      getDocs(query(collection(f, 'notifications'), where('recipientId', '==', APPLICANT), limit(20))),
    );
    await assertSucceeds(
      getDocs(
        query(
          collection(f, 'notifications'),
          where('recipientId', '==', APPLICANT),
          where('isRead', '==', false),
          limit(100),
        ),
      ),
    );
    await assertFails(
      getDocs(query(collection(db(OTHER), 'notifications'), where('isRead', '==', false), limit(100))),
    );
  });

  it('다른 사람에게 보내는 알림만 만들 수 있다', async () => {
    await assertSucceeds(setDoc(doc(db(OTHER), 'notifications/n2'), notification(APPLICANT)));
    await assertFails(setDoc(doc(db(OTHER), 'notifications/n3'), notification(OTHER)));
  });
});

describe('chatRooms', () => {
  const room = { participants: [APPLICANT, AUTHOR].sort(), lastMessage: '', leftAt: {} };

  beforeEach(async () => {
    await seed('chatRooms/r1', room);
    await seed('chatRooms/r1/messages/m1', { senderId: AUTHOR, text: 'hi', readBy: [AUTHOR] });
  });

  it('참여자만 방과 메시지를 읽을 수 있다', async () => {
    await assertSucceeds(getDoc(doc(db(APPLICANT), 'chatRooms/r1')));
    await assertSucceeds(getDocs(collection(db(APPLICANT), 'chatRooms/r1/messages')));
    await assertFails(getDoc(doc(db(OTHER), 'chatRooms/r1')));
    await assertFails(getDocs(collection(db(OTHER), 'chatRooms/r1/messages')));
  });

  it('최근 메시지만 불러오는 쿼리가 허용된다', async () => {
    const f = db(APPLICANT);
    await assertSucceeds(
      getDocs(query(collection(f, 'chatRooms/r1/messages'), orderBy('createdAt', 'asc'), limitToLast(50))),
    );
    await assertSucceeds(
      getDocs(query(collection(f, 'chatRooms/r1/messages'), orderBy('createdAt', 'desc'), limit(100))),
    );
  });

  it('채팅방 목록·기존 방 검색 쿼리가 허용된다', async () => {
    await assertSucceeds(
      getDocs(query(collection(db(APPLICANT), 'chatRooms'), where('participants', 'array-contains', APPLICANT))),
    );
    await assertSucceeds(
      getDocs(query(collection(db(APPLICANT), 'chatRooms'), where('participants', '==', room.participants))),
    );
  });

  it('자신이 포함된 방만 만들 수 있다', async () => {
    await assertSucceeds(setDoc(doc(db(OTHER), 'chatRooms/r2'), { participants: [OTHER, AUTHOR] }));
    await assertFails(setDoc(doc(db(OTHER), 'chatRooms/r3'), { participants: [APPLICANT, AUTHOR] }));
  });

  it('본인 명의로만 메시지를 보낼 수 있다', async () => {
    await assertSucceeds(
      setDoc(doc(db(APPLICANT), 'chatRooms/r1/messages/m2'), { senderId: APPLICANT, text: 'yo', readBy: [APPLICANT] }),
    );
    await assertFails(
      setDoc(doc(db(APPLICANT), 'chatRooms/r1/messages/m3'), { senderId: AUTHOR, text: 'fake', readBy: [] }),
    );
    await assertFails(
      setDoc(doc(db(OTHER), 'chatRooms/r1/messages/m4'), { senderId: OTHER, text: 'x', readBy: [] }),
    );
  });

  it('읽음 처리는 readBy에 자기 uid만 추가할 수 있다', async () => {
    await assertSucceeds(updateDoc(doc(db(APPLICANT), 'chatRooms/r1/messages/m1'), { readBy: [AUTHOR, APPLICANT] }));
    await assertFails(updateDoc(doc(db(APPLICANT), 'chatRooms/r1/messages/m1'), { text: '변조' }));
  });

  describe('닉네임 변경 반영 (participantNames)', () => {
    beforeEach(async () => {
      await seed('chatRooms/r1', { ...room, participantNames: { [APPLICANT]: '옛이름', [AUTHOR]: 'Alice' } });
      await seed(`users/${APPLICANT}`, { displayName: '새이름' });
      await seed(`users/${AUTHOR}`, { displayName: 'Alice' });
    });

    it('참여자는 내 항목을 users 문서의 현재 닉네임으로 바꿀 수 있다', async () => {
      await assertSucceeds(
        updateDoc(doc(db(APPLICANT), 'chatRooms/r1'), { [`participantNames.${APPLICANT}`]: '새이름' }),
      );
    });

    it('users 문서와 다른 이름으로는 바꿀 수 없다', async () => {
      await assertFails(
        updateDoc(doc(db(APPLICANT), 'chatRooms/r1'), { [`participantNames.${APPLICANT}`]: '아무이름' }),
      );
    });

    it('상대 항목은 바꿀 수 없다', async () => {
      await assertFails(
        updateDoc(doc(db(APPLICANT), 'chatRooms/r1'), { [`participantNames.${AUTHOR}`]: '새이름' }),
      );
    });

    it('다른 필드와 함께 바꿀 수 없다', async () => {
      await assertFails(
        updateDoc(doc(db(APPLICANT), 'chatRooms/r1'), {
          [`participantNames.${APPLICANT}`]: '새이름',
          lastMessage: '변조',
        }),
      );
    });

    it('참여자가 아니면 바꿀 수 없다', async () => {
      await seed(`users/${OTHER}`, { displayName: 'Carol' });
      await assertFails(updateDoc(doc(db(OTHER), 'chatRooms/r1'), { [`participantNames.${OTHER}`]: 'Carol' }));
    });
  });

  it('방 나가기와 마지막 메시지 갱신이 허용된다', async () => {
    await assertSucceeds(
      updateDoc(doc(db(APPLICANT), 'chatRooms/r1'), { [`leftAt.${APPLICANT}`]: serverTimestamp() }),
    );
    await assertSucceeds(
      updateDoc(doc(db(APPLICANT), 'chatRooms/r1'), { lastMessage: 'yo', lastMessageAt: serverTimestamp() }),
    );
    await assertFails(updateDoc(doc(db(APPLICANT), 'chatRooms/r1'), { participants: [APPLICANT, OTHER] }));
  });

  it('메시지가 많은 방도 일괄 삭제할 수 있다', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const f = ctx.firestore() as unknown as Firestore;
      const batch = writeBatch(f);
      for (let i = 0; i < 60; i++) batch.set(doc(f, `chatRooms/r1/messages/bulk${i}`), { senderId: AUTHOR });
      await batch.commit();
    });
    const f = db(APPLICANT);
    const snap = await getDocs(collection(f, 'chatRooms/r1/messages'));
    const batch = writeBatch(f);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await assertSucceeds(batch.commit());
    await assertSucceeds(deleteDoc(doc(f, 'chatRooms/r1')));
  });
});
