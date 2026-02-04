import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

const locations = [
  { name: '서울 강남 풋살장', address: '서울시 강남구 역삼동 123-45', lat: 37.5012, lng: 127.0396 },
  { name: '서울 마포 풋살파크', address: '서울시 마포구 합정동 456-78', lat: 37.5495, lng: 126.9138 },
  { name: '서울 송파 스포츠센터', address: '서울시 송파구 잠실동 789-12', lat: 37.5133, lng: 127.1001 },
  { name: '서울 영등포 풋살아레나', address: '서울시 영등포구 여의도동 234-56', lat: 37.5219, lng: 126.9245 },
  { name: '서울 성동 축구장', address: '서울시 성동구 성수동 567-89', lat: 37.5447, lng: 127.0558 },
  { name: '인천 부평 풋살장', address: '인천시 부평구 부평동 111-22', lat: 37.5074, lng: 126.7218 },
  { name: '경기 수원 풋살파크', address: '경기도 수원시 팔달구 인계동 333-44', lat: 37.2636, lng: 127.0286 },
  { name: '경기 분당 스포츠센터', address: '경기도 성남시 분당구 정자동 555-66', lat: 37.3595, lng: 127.1086 },
];

const levels = ['beginner', 'amateur', 'semi-pro', 'pro'] as const;

const titles = [
  '즐거운 주말 풋살',
  '퇴근 후 한 게임',
  '초보 환영 친선전',
  '실력자만 모여라',
  '가볍게 땀 흘리기',
  '주말 아침 풋살',
  '저녁 풋살 모집',
  '화요일 정기전',
  '수요일 번개',
  '금요 저녁 한판',
];

function getRandomDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

function getRandomTime(): string {
  const hours = [18, 19, 20, 21, 10, 11, 14, 15, 16];
  const hour = hours[Math.floor(Math.random() * hours.length)];
  return `${hour.toString().padStart(2, '0')}:00`;
}

export async function seedMatches(count: number = 20) {
  console.log(`${count}개의 매치 생성 시작...`);

  for (let i = 0; i < count; i++) {
    const location = locations[Math.floor(Math.random() * locations.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const maxParticipants = [10, 12, 14, 16][Math.floor(Math.random() * 4)];
    const currentParticipants = Math.floor(Math.random() * (maxParticipants - 2));
    const price = [10000, 12000, 15000, 18000, 20000][Math.floor(Math.random() * 5)];
    const daysFromNow = Math.floor(Math.random() * 14) + 1; // 1~14일 후

    const matchData = {
      title: titles[Math.floor(Math.random() * titles.length)],
      date: getRandomDate(daysFromNow),
      time: getRandomTime(),
      location: location.name,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      maxParticipants,
      currentParticipants,
      participants: [],
      level,
      price,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, 'matches'), matchData);
      console.log(`✅ 매치 ${i + 1} 생성: ${matchData.title} (${docRef.id})`);
    } catch (error) {
      console.error(`❌ 매치 ${i + 1} 생성 실패:`, error);
    }
  }

  console.log('매치 생성 완료!');
}