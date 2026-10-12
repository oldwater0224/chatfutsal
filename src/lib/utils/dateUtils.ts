const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export function isPostExpired(date: string, time: string): boolean {
  const timeStr = time || "23:59";
  const matchDateTime = new Date(`${date}T${timeStr}:00`);
  return Date.now() >= matchDateTime.getTime();
}

export function toLocalDateString(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

// toISOString()은 UTC 기준이라 KST 자정~오전 9시에는 전날이 반환된다
export function getTodayString(): string {
  return toLocalDateString(new Date());
}

export function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function formatMatchDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return `${m}월 ${d}일 (${getDayName(new Date(y, m - 1, d))})`;
}
