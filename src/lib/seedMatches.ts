import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const sampleMatches = [
  {
    title: '가산 풋살파크 6vs6',
    date: '2025-01-27',
    time: '19:00',
    location: '서울 금천구',
    address: '서울 금천구 가산디지털1로 142',
    lat: 37.4812,
    lng: 126.8826,
    maxParticipants: 12,
    currentParticipants: 8,
    participants: [],
    level: 'amateur',
    price: 12000,
    status: 'open',
    createdAt: Timestamp.now(),
  },
  {
    title: '잠실 실내풋살장',
    date: '2025-01-27',
    time: '20:00',
    location: '서울 송파구',
    address: '서울 송파구 올림픽로 25',
    lat: 37.5145,
    lng: 127.1017,
    maxParticipants: 12,
    currentParticipants: 12,
    participants: [],
    level: 'semi-pro',
    price: 15000,
    status: 'confirmed',
    createdAt: Timestamp.now(),
  },
  {
    title: '판교 풋살클럽 초보 환영',
    date: '2025-01-28',
    time: '18:00',
    location: '경기 성남시',
    address: '경기 성남시 분당구 판교역로 235',
    lat: 37.3947,
    lng: 127.1109,
    maxParticipants: 10,
    currentParticipants: 5,
    participants: [],
    level: 'beginner',
    price: 10000,
    status: 'open',
    createdAt: Timestamp.now(),
  },
];

export async function seedMatches() {
  const matchesRef = collection(db, 'matches');

  for (const match of sampleMatches) {
    await addDoc(matchesRef, match);
    console.log('매치 추가됨:', match.title);
  }

  console.log('샘플 데이터 추가 완료!');
}