import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import { isPostExpired } from '../utils/dateUtils';
import { testUsers } from './seedChats';

// 테스트용 구장 데이터 (주소에 지역명이 포함되어야 지역 필터에 걸린다)
const venues = [
  { name: '강남 풋살파크', lat: 37.4979, lng: 127.0276, address: '서울 강남구 테헤란로 152' },
  { name: '마포 풋살장', lat: 37.5663, lng: 126.9019, address: '서울 마포구 월드컵로 240' },
  { name: '송파 스포츠센터 풋살장', lat: 37.5145, lng: 127.1059, address: '서울 송파구 올림픽로 300' },
  { name: '영등포 실내풋살장', lat: 37.5264, lng: 126.8963, address: '서울 영등포구 영중로 15' },
  { name: '성남 분당 풋살클럽', lat: 37.3595, lng: 127.1052, address: '경기 성남시 분당구 황새울로 200' },
  { name: '수원 월드컵 풋살장', lat: 37.2866, lng: 127.0369, address: '경기 수원시 팔달구 월드컵로 310' },
  { name: '인천 송도 풋살파크', lat: 37.3894, lng: 126.6439, address: '인천 연수구 컨벤시아대로 165' },
  { name: '부산 해운대 풋살장', lat: 35.1631, lng: 129.1636, address: '부산 해운대구 해운대로 620' },
  { name: '대구 수성 풋살센터', lat: 35.8581, lng: 128.6306, address: '대구 수성구 달구벌대로 2450' },
  { name: '대전 유성 풋살장', lat: 36.3622, lng: 127.3563, address: '대전 유성구 대학로 99' },
  { name: '광주 상무 풋살파크', lat: 35.1531, lng: 126.8513, address: '광주 서구 상무중앙로 110' },
];

type Level = 'beginner' | 'amateur' | 'semipro' | 'pro';

interface PostTemplate {
  time: string;
  venue: number; // venues 인덱스
  level: Level;
  needCount: number;
  title: string;
  content: string;
}

// 요일별 게시글 3개씩 (0: 일 ~ 6: 토)
const postsByWeekday: PostTemplate[][] = [
  // 일
  [
    { time: '09:00', venue: 4, level: 'amateur', needCount: 2, title: '일요일 아침 분당 풋살 2명 구해요', content: '가볍게 땀 흘리실 분 환영합니다. 조끼 준비되어 있어요.' },
    { time: '14:00', venue: 7, level: 'semipro', needCount: 1, title: '해운대 일요일 오후 매치 용병 1명', content: '팀 매치입니다. 피보 포지션 선호합니다.' },
    { time: '19:00', venue: 1, level: 'beginner', needCount: 3, title: '마포 초보 환영 일요일 저녁 풋살', content: '풋살 처음이셔도 괜찮아요! 즐겁게 차실 분 오세요.' },
  ],
  // 월
  [
    { time: '19:30', venue: 0, level: 'amateur', needCount: 2, title: '월요일 퇴근 후 강남 풋살 2명', content: '직장인 위주 모임입니다. 매너 플레이 부탁드려요.' },
    { time: '20:00', venue: 8, level: 'beginner', needCount: 3, title: '대구 수성 월요일 초보 풋살', content: '실력 상관없이 즐기실 분 모집합니다.' },
    { time: '21:00', venue: 6, level: 'semipro', needCount: 1, title: '송도 월요일 밤 매치 골키퍼 구합니다', content: '골키퍼 가능하신 분 우대합니다.' },
  ],
  // 화
  [
    { time: '19:00', venue: 2, level: 'amateur', needCount: 2, title: '화요일 송파 풋살 용병 2명', content: '5:5 경기 진행합니다. 풋살화 지참해주세요.' },
    { time: '20:30', venue: 5, level: 'pro', needCount: 1, title: '수원 화요일 고강도 매치 1명', content: '선출 또는 그에 준하는 실력자 구합니다.' },
    { time: '21:00', venue: 10, level: 'beginner', needCount: 4, title: '광주 상무 화요일 친선 풋살', content: '친목 위주 모임입니다. 편하게 오세요.' },
  ],
  // 수
  [
    { time: '19:00', venue: 3, level: 'beginner', needCount: 3, title: '수요일 영등포 초보 풋살 모집', content: '운동 부족 탈출하실 분! 부담없이 신청하세요.' },
    { time: '20:00', venue: 9, level: 'amateur', needCount: 2, title: '대전 유성 수요일 저녁 풋살', content: '대학생/직장인 섞여서 찹니다.' },
    { time: '21:30', venue: 0, level: 'semipro', needCount: 2, title: '강남 수요일 밤 팀매치 용병', content: '상대팀과 매치 예정입니다. 실력자 환영.' },
  ],
  // 목
  [
    { time: '19:30', venue: 4, level: 'amateur', needCount: 2, title: '목요일 분당 퇴근 풋살 2명', content: '2시간 대관했습니다. 회비는 현장에서 정산해요.' },
    { time: '20:00', venue: 7, level: 'beginner', needCount: 3, title: '해운대 목요일 초보 풋살', content: '천천히 즐기면서 찰 분 구해요.' },
    { time: '21:00', venue: 1, level: 'pro', needCount: 1, title: '마포 목요일 하드 매치 1명', content: '빠른 템포 경기입니다. 체력 자신 있으신 분.' },
  ],
  // 금
  [
    { time: '19:00', venue: 6, level: 'amateur', needCount: 2, title: '불금 송도 풋살 같이 하실 분', content: '경기 후 간단히 식사도 해요 (선택).' },
    { time: '20:30', venue: 2, level: 'semipro', needCount: 1, title: '송파 금요일 저녁 매치 1명', content: '수비 포지션 가능하신 분 구합니다.' },
    { time: '22:00', venue: 8, level: 'beginner', needCount: 3, title: '대구 금요일 밤 친선 풋살', content: '늦은 시간이지만 즐겁게 차요!' },
  ],
  // 토
  [
    { time: '10:00', venue: 5, level: 'beginner', needCount: 4, title: '토요일 아침 수원 풋살 초보 환영', content: '주말 아침 상쾌하게 시작하실 분 모여요.' },
    { time: '15:00', venue: 3, level: 'amateur', needCount: 2, title: '영등포 토요일 오후 풋살 2명', content: '6:6 진행 예정입니다. 조끼 있어요.' },
    { time: '18:00', venue: 9, level: 'semipro', needCount: 2, title: '대전 토요일 저녁 팀매치 용병', content: '토너먼트 대비 연습 경기입니다.' },
  ],
];

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 오늘부터 7일간 요일별 3개씩 모집글 생성 (이미 지난 시간은 다음 주 같은 요일로)
export async function seedRecruitPosts() {
  console.log('모집글 생성 시작...');

  const today = new Date();
  let index = 0;
  let created = 0;

  for (let offset = 0; offset < 7; offset++) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);

    for (const template of postsByWeekday[day.getDay()]) {
      let date = toDateString(day);
      if (isPostExpired(date, template.time)) {
        const nextWeek = new Date(day);
        nextWeek.setDate(day.getDate() + 7);
        date = toDateString(nextWeek);
      }

      const author = testUsers[index % testUsers.length];
      const venue = venues[template.venue];
      index++;

      try {
        await addDoc(collection(db, 'recruitPosts'), {
          authorId: author.uid,
          authorName: author.displayName,
          title: template.title,
          content: template.content,
          date,
          time: template.time,
          location: venue.name,
          locationCoord: { lat: venue.lat, lng: venue.lng, address: venue.address },
          level: template.level,
          needCount: template.needCount,
          acceptedCount: 0,
          applicantIds: [],
          status: 'open',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        created++;
        console.log(`✅ 모집글 생성: [${date} ${template.time}] ${template.title}`);
      } catch (error) {
        console.error(`❌ 모집글 생성 실패:`, error);
      }
    }
  }

  console.log(`총 ${created}개 모집글 생성 완료!`);
}

// 테스트 유저가 작성한 모집글 삭제
export async function deleteSeedRecruitPosts() {
  console.log('테스트 모집글 삭제 시작...');

  const q = query(
    collection(db, 'recruitPosts'),
    where('authorId', 'in', testUsers.map((user) => user.uid)),
  );
  const snapshot = await getDocs(q);

  for (const postDoc of snapshot.docs) {
    await deleteDoc(doc(db, 'recruitPosts', postDoc.id));
  }

  console.log(`총 ${snapshot.size}개 모집글 삭제 완료!`);
}
