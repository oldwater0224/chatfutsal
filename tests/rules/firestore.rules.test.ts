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
  deleteField,
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

// users 문서 닉네임 (복사된 이름은 이 값과 같아야 한다)
const NAMES: Record<string, string> = { [AUTHOR]: 'Alice', [APPLICANT]: 'Bob', [OTHER]: 'Carol' };

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
async function apply(uid: string, postId = 'p1', applicantName = NAMES[uid]) {
  const f = db(uid);
  const postRef = doc(f, 'recruitPosts', postId);
  await runTransaction(f, async (tx) => {
    await tx.get(postRef);
    tx.set(doc(collection(f, 'applications')), {
      postId,
      postTitle: '주말 풋살',
      applicantId: uid,
      applicantName,
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
  for (const [uid, displayName] of Object.entries(NAMES)) await seed(`users/${uid}`, { displayName });
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
  const NEW = 'dave';
  const ch = (code: number) => String.fromCharCode(code);
  const create = (displayName: unknown) => setDoc(doc(db(NEW), 'users', NEW), { displayName });
  const rename = (displayName: unknown) => updateDoc(doc(db(APPLICANT), 'users', APPLICANT), { displayName });

  it('본인 문서만 쓸 수 있다', async () => {
    await assertSucceeds(setDoc(doc(db(APPLICANT), 'users', APPLICANT), { displayName: 'Bob' }));
    await assertFails(setDoc(doc(db(OTHER), 'users', APPLICANT), { displayName: 'hack' }));
  });

  it('가입 시 닉네임은 2~24 UTF-16 단위여야 한다', async () => {
    await assertFails(create('김'));
    await assertSucceeds(create('김밥'));
    await assertSucceeds(create('가'.repeat(24)));
    await assertFails(create('가'.repeat(25)));
  });

  it('닉네임이 없거나 문자열이 아니면 가입할 수 없다', async () => {
    await assertFails(setDoc(doc(db(NEW), 'users', NEW), { email: null }));
    await assertFails(create(123));
  });

  it('이모지 12개(24단위)는 허용, 13개는 거부', async () => {
    await assertSucceeds(create('😀'.repeat(12)));
    await assertFails(rename('😀'.repeat(13)));
  });

  it('앞뒤 공백이 있으면 거부', async () => {
    await assertFails(create(' 풋살러'));
    await assertFails(create('풋살러 '));
  });

  it('제어문자·보이지 않는 문자·방향 제어 문자는 거부', async () => {
    for (const code of [0x00, 0x0a, 0x1f, 0x7f, 0x200b, 0x2060, 0xfeff, 0x202a, 0x202e, 0x2066, 0x2069]) {
      await assertFails(rename(`풋${ch(code)}살`));
    }
  });

  it('ZWJ 이모지 조합은 허용', async () => {
    await assertSucceeds(rename(`풋살👨${ch(0x200d)}👩`));
  });

  it('닉네임 변경도 같은 규칙으로 검사한다', async () => {
    await assertSucceeds(rename('새닉네임'));
    await assertFails(rename('x'));
  });

  it('예전 규칙으로 저장된 긴 닉네임이 있어도 다른 필드는 바꿀 수 있다', async () => {
    await seed(`users/${APPLICANT}`, { displayName: '가'.repeat(30) });
    await assertSucceeds(updateDoc(doc(db(APPLICANT), 'users', APPLICANT), { profileImage: 'x' }));
    await assertFails(rename('가'.repeat(30) + '나'));
  });

  it('닉네임을 지울 수 없다', async () => {
    await assertFails(updateDoc(doc(db(APPLICANT), 'users', APPLICANT), { displayName: deleteField() }));
    await assertFails(setDoc(doc(db(APPLICANT), 'users', APPLICANT), { profileImage: 'x' }));
  });
});

describe('fcmTokens', () => {
  const TOKEN = 'fcm-token:abc_123';
  const tokenRef = (uid: string) => doc(db(uid), 'fcmTokens', TOKEN);

  it('본인 uid로 토큰을 저장·조회·삭제할 수 있다', async () => {
    await assertSucceeds(setDoc(tokenRef(APPLICANT), { uid: APPLICANT, updatedAt: serverTimestamp() }));
    await assertSucceeds(getDoc(tokenRef(APPLICANT)));
    await assertSucceeds(deleteDoc(tokenRef(APPLICANT)));
  });

  it('다른 사람의 토큰은 읽거나 지울 수 없다', async () => {
    await seed(`fcmTokens/${TOKEN}`, { uid: APPLICANT, updatedAt: new Date() });
    await assertFails(getDoc(tokenRef(OTHER)));
    await assertFails(deleteDoc(tokenRef(OTHER)));
    await assertFails(getDocs(query(collection(db(OTHER), 'fcmTokens'), where('uid', '==', APPLICANT))));
  });

  it('같은 기기에서 다른 계정으로 로그인하면 토큰 소유자를 바꿀 수 있다', async () => {
    await seed(`fcmTokens/${TOKEN}`, { uid: APPLICANT, updatedAt: new Date() });
    await assertSucceeds(setDoc(tokenRef(OTHER), { uid: OTHER, updatedAt: serverTimestamp() }));
  });

  it('다른 사람 uid로 저장하거나 다른 필드를 넣을 수 없다', async () => {
    await assertFails(setDoc(tokenRef(OTHER), { uid: APPLICANT, updatedAt: serverTimestamp() }));
    await assertFails(setDoc(tokenRef(APPLICANT), { uid: APPLICANT, updatedAt: serverTimestamp(), extra: 1 }));
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

  it('작성자 이름은 users 문서 닉네임이나 기본값만 쓸 수 있다', async () => {
    const f = db(AUTHOR);
    await assertSucceeds(setDoc(doc(f, 'recruitPosts/p2'), { ...futurePost, authorName: '사용자' }));
    await assertFails(setDoc(doc(f, 'recruitPosts/p3'), { ...futurePost, authorName: '운영팀' }));
    await assertFails(setDoc(doc(f, 'recruitPosts/p4'), { ...futurePost, authorName: 'Bob' }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { authorName, ...noName } = futurePost;
    await assertFails(setDoc(doc(f, 'recruitPosts/p5'), noName));
  });

  it('users 문서가 없으면 기본값으로만 작성할 수 있다', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore() as unknown as Firestore, `users/${AUTHOR}`));
    });
    const f = db(AUTHOR);
    await assertFails(setDoc(doc(f, 'recruitPosts/p2'), futurePost));
    await assertSucceeds(setDoc(doc(f, 'recruitPosts/p3'), { ...futurePost, authorName: '사용자' }));
  });

  it('작성자 이름은 바꿀 때만 검사한다', async () => {
    // 글을 쓴 뒤 닉네임을 바꿔 authorName이 users 문서와 달라도 다른 필드는 수정할 수 있다
    await seed(`users/${AUTHOR}`, { displayName: '새이름' });
    const ref = doc(db(AUTHOR), 'recruitPosts/p1');
    await assertSucceeds(updateDoc(ref, { title: '수정' }));
    await assertFails(updateDoc(ref, { authorName: '운영팀' }));
    await assertFails(updateDoc(ref, { authorName: deleteField() }));
    await assertSucceeds(updateDoc(ref, { authorName: '새이름' }));
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

  it('신청자 이름은 users 문서 닉네임이나 기본값만 쓸 수 있다', async () => {
    await assertFails(apply(APPLICANT, 'p1', '운영팀'));
    await assertFails(apply(APPLICANT, 'p1', 'Alice'));
    await assertSucceeds(apply(APPLICANT, 'p1', '사용자'));
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

  it('senderId는 본인 uid만 넣을 수 있다 (없어도 된다)', async () => {
    const f = db(OTHER);
    await assertSucceeds(setDoc(doc(f, 'notifications/n2'), { ...notification(APPLICANT), senderId: OTHER }));
    await assertFails(setDoc(doc(f, 'notifications/n3'), { ...notification(APPLICANT), senderId: AUTHOR }));
  });

  it('생성 시각은 서버 시각이어야 한다', async () => {
    await assertFails(
      setDoc(doc(db(OTHER), 'notifications/n2'), { ...notification(APPLICANT), createdAt: new Date() }),
    );
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

  describe('새 방의 participantNames', () => {
    const create = (participantNames: Record<string, unknown>, id = 'r2') =>
      setDoc(doc(db(OTHER), 'chatRooms', id), { participants: [AUTHOR, OTHER].sort(), participantNames });

    it('각자의 users 문서 닉네임이나 기본값이면 만들 수 있다', async () => {
      await assertSucceeds(create({ [OTHER]: 'Carol', [AUTHOR]: 'Alice' }));
      await assertSucceeds(create({ [OTHER]: '사용자', [AUTHOR]: '사용자' }, 'r3'));
      await assertSucceeds(create({ [OTHER]: 'Carol' }, 'r4'));
    });

    it('상대 이름을 바꿔 쓸 수 없다', async () => {
      await assertFails(create({ [OTHER]: 'Carol', [AUTHOR]: '운영팀' }));
      await assertFails(create({ [OTHER]: '관리자', [AUTHOR]: 'Alice' }));
    });

    it('참여자가 아닌 항목을 넣을 수 없다', async () => {
      await assertFails(create({ [OTHER]: 'Carol', [AUTHOR]: 'Alice', [APPLICANT]: 'Bob' }));
    });

    it('이름이 문자열이 아니면 거부', async () => {
      await assertFails(create({ [OTHER]: 'Carol', [AUTHOR]: null }));
    });
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

// 지금 규칙(2자 이상)보다 먼저 저장된 1글자 닉네임 사용자도 기존 기능을 그대로 쓸 수 있어야 한다
describe('예전 규칙으로 저장된 1글자 닉네임', () => {
  beforeEach(async () => {
    await seed(`users/${AUTHOR}`, { displayName: '김' });
    await seed(`users/${APPLICANT}`, { displayName: '이' });
    await seed('recruitPosts/p1', { ...futurePost, authorName: '김' });
  });

  it('다른 필드는 바꿀 수 있고, 닉네임을 같은 값으로 다시 써도 된다', async () => {
    const ref = doc(db(APPLICANT), 'users', APPLICANT);
    await assertSucceeds(updateDoc(ref, { profileImage: 'x' }));
    await assertSucceeds(setDoc(ref, { displayName: '이', profileImage: 'y' }));
  });

  it('모집글을 쓰고 신청하고 채팅방을 만들 수 있다', async () => {
    await assertSucceeds(setDoc(doc(db(AUTHOR), 'recruitPosts/p2'), { ...futurePost, authorName: '김' }));
    await assertSucceeds(apply(APPLICANT, 'p1', '이'));
    await assertSucceeds(
      setDoc(doc(db(APPLICANT), 'chatRooms/r9'), {
        participants: [APPLICANT, AUTHOR].sort(),
        participantNames: { [APPLICANT]: '이', [AUTHOR]: '김' },
      }),
    );
  });
});
