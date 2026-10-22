// 경기 시간이 지난 모집글 정리 계획 (Firestore에 의존하지 않는 순수 함수)
// 서버는 UTC로 동작하므로, 모집글의 date/time(한국 시간)은 KST로 명시해 비교한다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface ExpiredPostCandidate {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD" (KST)
  time: string; // "HH:MM" (KST)
  status: "open" | "closed";
  applicantIds?: string[];
  acceptedCount?: number;
}

export interface PendingApplication {
  id: string;
  applicantId: string;
}

export interface PostCleanupPlan {
  postId: string;
  postTitle: string;
  closePost: boolean;
  pending: PendingApplication[];
}

// now 기준 KST 날짜 문자열에서 days만큼 이동한 날짜
export function kstDateString(now: Date, offsetDays = 0): string {
  const kst = new Date(now.getTime() + KST_OFFSET_MS + offsetDays * 24 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// 경기 시작 시각(KST)이 지났는지. 시간이 없으면 그날 23:59로 본다 (dateUtils.isPostExpired와 동일)
export function isMatchStartedKst(date: string, time: string, now: Date): boolean {
  const start = Date.parse(`${date}T${time || "23:59"}:00+09:00`);
  return !Number.isNaN(start) && now.getTime() >= start;
}

// 정리 대상 글: 경기 시간이 지났고, 아직 open이거나 대기 신청이 남은 글
// (applicantIds = 대기 + 수락, acceptedCount = 수락이므로 차이가 대기 인원)
export function needsCleanup(post: ExpiredPostCandidate, now: Date): boolean {
  if (!isMatchStartedKst(post.date, post.time, now)) return false;
  const pendingCount = (post.applicantIds?.length ?? 0) - (post.acceptedCount ?? 0);
  return post.status === "open" || pendingCount > 0;
}

export function planCleanup(
  post: ExpiredPostCandidate,
  pending: PendingApplication[],
): PostCleanupPlan {
  return { postId: post.id, postTitle: post.title, closePost: post.status === "open", pending };
}
