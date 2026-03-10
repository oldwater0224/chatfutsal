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

export interface MatchCardProps {
  match: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    currentParticipants: number;
    maxParticipants: number;
    level: string;
  };
}
export interface FilterState {
  date: string;
  region: string;
  level: string;
}
export interface MatchFilterProps {
  filters : FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export interface Match {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  address: string;
  lat?: number;
  lng?: number;
  maxParticipants: number;
  currentParticipants: number;
  participants: string[];
  level: "beginner" | "amateur" | "semipro" | "pro";
  price: number;
  status: "open" | "confirmed" | "completed" | "cancelled";
  createdAt: Date;
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
export interface RecruitPost{
  id : string;
  authorId : string;
  authorName : string;
  title : string;
  content : string;
  date : string;
  time : string;
  location : string;
  level : 'beginner' | 'amateur' | 'semipro' | 'pro';
  needCount : number; // 모집 인원
  status : 'open' | 'closed'; // 모집 상태
  createdAt : Date;
  updatedAt : Date;
}
