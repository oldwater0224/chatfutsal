export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

export interface AuthFormProps {
  mode: "login" | "signup";
  onSubmit: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
}


export interface ChatRoom {
  id: string;
  participantNames: Record<string, string>;
  participantName: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
  readBy: string[];
}
export interface RecruitPost {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  date: string;
  time: string;
  location: string;
  locationCoord : {
    lat : number;
    lng : number;
    address : string;
  },
  level: "beginner" | "amateur" | "semipro" | "pro";
  needCount: number; // 모집 인원
  status: "open" | "closed"; // 모집 상태
  createdAt: Date;
  updatedAt: Date;
}
// Kakao Maps SDK 타입
export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  setLevel(level: number): void;
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
}

export interface KakaoPlaceSearchResult {
  place_name: string;
  road_address_name: string;
  address_name: string;
  x: string;
  y: string;
}

export interface KakaoMaps {
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  Marker: new (options: { position: KakaoLatLng }) => KakaoMarker;
  InfoWindow: new (options: { content: string }) => { open(map: KakaoMap, marker: KakaoMarker): void };
  load(callback: () => void): void;
  services: {
    Places: new () => {
      keywordSearch(keyword: string, callback: (data: KakaoPlaceSearchResult[], status: string) => void): void;
    };
    Status: { OK: string };
  };
}

export interface KakaoSDK {
  maps: KakaoMaps;
}

// Firestore Timestamp 호환 타입
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

export type DateLike = Date | FirestoreTimestamp;

// Firebase Auth 에러 타입
export interface FirebaseAuthError {
  code: string;
  message: string;
}

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "비기너",
  amateur: "아마추어",
  semipro: "세미프로",
  pro: "프로",
};

export const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  amateur: "bg-blue-100 text-blue-700",
  semipro: "bg-purple-100 text-purple-700",
  pro: "bg-red-100 text-red-700",
};
