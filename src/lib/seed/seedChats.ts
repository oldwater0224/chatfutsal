import { collection, addDoc, doc, setDoc , deleteDoc , getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// 테스트용 유저 데이터
const testUsers = [
  { uid: 'test_user_1', email: 'player1@test.com', displayName: '축구왕김철수' },
  { uid: 'test_user_2', email: 'player2@test.com', displayName: '골키퍼박영희' },
  { uid: 'test_user_3', email: 'player3@test.com', displayName: '드리블러이민수' },
  { uid: 'test_user_4', email: 'player4@test.com', displayName: '수비수최지영' },
  { uid: 'test_user_5', email: 'player5@test.com', displayName: '공격수정대호' },
  { uid: 'test_user_6', email: 'player6@test.com', displayName: '미드필더한소희' },
];

// 테스트용 채팅 메시지 시나리오
const chatScenarios = [
  {
    users: [0, 1], // testUsers 인덱스
    messages: [
      { sender: 0, text: '안녕하세요! 풋살 자주 하시나요?' },
      { sender: 1, text: '네! 매주 주말마다 해요 ㅎㅎ' },
      { sender: 0, text: '오 저도요! 다음에 같이 해요' },
      { sender: 1, text: '좋아요! 이번주 토요일 어때요?' },
      { sender: 0, text: '토요일 저녁 괜찮아요!' },
    ],
  },
  {
    users: [2, 3],
    messages: [
      { sender: 0, text: '이번 주 토요일 매치 신청하셨어요?' },
      { sender: 1, text: '네 방금 했어요!' },
      { sender: 0, text: '저도 할게요 같이 뛰어요' },
      { sender: 1, text: '좋아요! 화이팅입니다 💪' },
    ],
  },
  {
    users: [0, 2],
    messages: [
      { sender: 0, text: '어제 경기 재밌었어요' },
      { sender: 1, text: '진짜요 ㅋㅋ 골 넣으셨을때 소름돋았어요' },
      { sender: 0, text: '감사합니다 ㅎㅎ 다음에 또 해요' },
      { sender: 1, text: '네 다음주도 신청해둘게요!' },
    ],
  },
  {
    users: [3, 4],
    messages: [
      { sender: 0, text: '포지션이 어디세요?' },
      { sender: 1, text: '저는 주로 공격수요! 수비수님이시죠?' },
      { sender: 0, text: '네 맞아요 ㅎㅎ' },
      { sender: 1, text: '잘 맞겠네요! 이번주 같이 뛰어요' },
    ],
  },
  {
    users: [1, 5],
    messages: [
      { sender: 0, text: '혹시 실력 어느정도세요?' },
      { sender: 1, text: '아마추어 정도요 ㅎㅎ 아직 많이 부족해요' },
      { sender: 0, text: '저도 비슷해요 다행이다' },
      { sender: 1, text: '같이 연습해요! 화이팅!' },
    ],
  },
  {
    users: [4, 5],
    messages: [
      { sender: 0, text: '강남 풋살장 어떤가요?' },
      { sender: 1, text: '시설 좋아요! 주차도 편하고' },
      { sender: 0, text: '오 그럼 이번주 거기서 할까요?' },
      { sender: 1, text: '좋아요 저도 신청할게요' },
      { sender: 0, text: '넵! 거기서 봬요 ㅎㅎ' },
    ],
  },
];

export async function seedTestUsers() {
  console.log('테스트 유저 생성 시작...');

  for (const user of testUsers) {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: new Date().toISOString(),
      });
      console.log(`✅ 유저 생성: ${user.displayName}`);
    } catch (error) {
      console.error(`❌ 유저 생성 실패:`, error);
    }
  }

  console.log('테스트 유저 생성 완료!');
  return testUsers;
}

export async function seedChatRooms() {
  console.log('채팅방 생성 시작...');

  for (let i = 0; i < chatScenarios.length; i++) {
    const scenario = chatScenarios[i];
    const user1 = testUsers[scenario.users[0]];
    const user2 = testUsers[scenario.users[1]];

    try {
      // 채팅방 생성
      const participants = [user1.uid, user2.uid].sort();
      const lastMessage = scenario.messages[scenario.messages.length - 1];
      const lastSender = testUsers[scenario.users[lastMessage.sender]];

      const chatRoomRef = await addDoc(collection(db, 'chatRooms'), {
        participants,
        participantNames: {
          [user1.uid]: user1.displayName,
          [user2.uid]: user2.displayName,
        },
        lastMessage: lastMessage.text,
        lastMessageAt: new Date(Date.now() - i * 3600000), // 1시간씩 차이
        createdAt: new Date(Date.now() - (i + 1) * 86400000), // 1일씩 차이
      });

      console.log(`✅ 채팅방 ${i + 1} 생성: ${user1.displayName} <-> ${user2.displayName}`);

      // 메시지 추가
      for (let j = 0; j < scenario.messages.length; j++) {
        const msg = scenario.messages[j];
        const sender = testUsers[scenario.users[msg.sender]];

        await addDoc(collection(db, 'chatRooms', chatRoomRef.id, 'messages'), {
          senderId: sender.uid,
          senderName: sender.displayName,
          text: msg.text,
          createdAt: new Date(Date.now() - (scenario.messages.length - j) * 60000), // 1분 간격
          readBy: [sender.uid],
        });
      }

      console.log(`   └─ ${scenario.messages.length}개 메시지 추가`);
    } catch (error) {
      console.error(`❌ 채팅방 ${i + 1} 생성 실패:`, error);
    }
  }

  console.log('채팅방 생성 완료!');
}

// 특정 유저와 테스트 유저 간의 채팅방 생성 (로그인한 유저용)
export async function seedChatRoomsWithUser(currentUserId: string, currentUserName: string) {
  console.log('내 채팅방 생성 시작...');

  const myScenarios = [
    {
      targetUser: testUsers[0],
      messages: [
        { isMe: false, text: '안녕하세요! 같이 풋살 하실래요?' },
        { isMe: true, text: '네 좋아요! 언제 하실 건가요?' },
        { isMe: false, text: '이번 주 토요일 저녁 어때요?' },
        { isMe: true, text: '좋습니다! 신청할게요' },
      ],
    },
    {
      targetUser: testUsers[1],
      messages: [
        { isMe: true, text: '어제 경기 수고하셨어요!' },
        { isMe: false, text: '감사합니다 ㅎㅎ 재밌었어요' },
        { isMe: true, text: '다음에 또 같이 해요' },
      ],
    },
    {
      targetUser: testUsers[2],
      messages: [
        { isMe: false, text: '혹시 실력이 어느정도세요?' },
        { isMe: true, text: '아마추어 정도요!' },
        { isMe: false, text: '저도 비슷해요 ㅎㅎ 같이 뛰어요' },
      ],
    },
  ];

  for (let i = 0; i < myScenarios.length; i++) {
    const scenario = myScenarios[i];
    const targetUser = scenario.targetUser;

    try {
      const participants = [currentUserId, targetUser.uid].sort();
      const lastMessage = scenario.messages[scenario.messages.length - 1];

      const chatRoomRef = await addDoc(collection(db, 'chatRooms'), {
        participants,
        participantNames: {
          [currentUserId]: currentUserName,
          [targetUser.uid]: targetUser.displayName,
        },
        lastMessage: lastMessage.text,
        lastMessageAt: new Date(Date.now() - i * 1800000), // 30분씩 차이
        createdAt: new Date(Date.now() - (i + 1) * 43200000), // 12시간씩 차이
      });

      console.log(`✅ 내 채팅방 ${i + 1} 생성: 나 <-> ${targetUser.displayName}`);

      for (let j = 0; j < scenario.messages.length; j++) {
        const msg = scenario.messages[j];
        const senderId = msg.isMe ? currentUserId : targetUser.uid;
        const senderName = msg.isMe ? currentUserName : targetUser.displayName;

        await addDoc(collection(db, 'chatRooms', chatRoomRef.id, 'messages'), {
          senderId,
          senderName,
          text: msg.text,
          createdAt: new Date(Date.now() - (scenario.messages.length - j) * 60000),
          readBy: [senderId],
        });
      }

      console.log(`   └─ ${scenario.messages.length}개 메시지 추가`);
    } catch (error) {
      console.error(`❌ 내 채팅방 ${i + 1} 생성 실패:`, error);
    }
  }

  console.log('내 채팅방 생성 완료!');
}
// 테스트 유저 삭제
export async function deleteTestUsers() {
  console.log('테스트 유저 삭제 시작...');

  for (const user of testUsers) {
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      console.log(`✅ 유저 삭제: ${user.displayName}`);
    } catch (error) {
      console.error(`❌ 유저 삭제 실패:`, error);
    }
  }

  console.log('테스트 유저 삭제 완료!');
}

// 모든 채팅방 삭제
export async function deleteAllChatRooms() {
  console.log('모든 채팅방 삭제 시작...');

  try {
    const chatRoomsRef = collection(db, 'chatRooms');
    const snapshot = await getDocs(chatRoomsRef);

    for (const chatRoomDoc of snapshot.docs) {
      // 메시지 서브컬렉션 먼저 삭제
      const messagesRef = collection(db, 'chatRooms', chatRoomDoc.id, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);

      for (const msgDoc of messagesSnapshot.docs) {
        await deleteDoc(doc(db, 'chatRooms', chatRoomDoc.id, 'messages', msgDoc.id));
      }

      // 채팅방 삭제
      await deleteDoc(doc(db, 'chatRooms', chatRoomDoc.id));
      console.log(`✅ 채팅방 삭제: ${chatRoomDoc.id}`);
    }

    console.log(`총 ${snapshot.size}개 채팅방 삭제 완료!`);
  } catch (error) {
    console.error('❌ 채팅방 삭제 실패:', error);
    throw error;
  }
}
