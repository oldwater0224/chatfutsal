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
export interface MatchFilterProps {
  onFilterChange: (filters: { date: string; region: string }) => void;
}
