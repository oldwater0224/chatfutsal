export interface User {
  id: string;
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

export interface MatchFilterProps {
  onFilterChange: (filters: { date: string; region: string }) => void;
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
  createdAt: Date;  // ✅ 추가됨
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
  readBy: string[];
}