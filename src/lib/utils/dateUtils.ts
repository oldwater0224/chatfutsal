export function isPostExpired(date: string, time: string): boolean {
  const timeStr = time || "23:59";
  const matchDateTime = new Date(`${date}T${timeStr}:00`);
  return Date.now() >= matchDateTime.getTime();
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}
