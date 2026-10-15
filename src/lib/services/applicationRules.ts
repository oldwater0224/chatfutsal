// 참가 신청 상태 전이 검증 (Firebase 의존성 없는 순수 함수)
// 트랜잭션 안에서 읽은 최신 문서로 판단해야 동시 요청에도 정원·중복이 지켜진다

import { Application, RecruitPost } from "../../types";
import { isPostExpired } from "../utils/dateUtils";

type PostState = Pick<RecruitPost, "status" | "needCount"> &
  Partial<Pick<RecruitPost, "acceptedCount" | "applicantIds">>;

export class ApplicationError extends Error {}

export function assertCanApply(post: PostState | undefined, applicantId: string): void {
  if (!post) throw new ApplicationError("존재하지 않는 모집글입니다.");
  if (post.status !== "open") throw new ApplicationError("마감된 모집입니다.");
  if (post.applicantIds?.includes(applicantId)) {
    throw new ApplicationError("이미 신청한 모집입니다.");
  }
}

export function assertPending(app: Pick<Application, "status"> | undefined): void {
  if (!app) throw new ApplicationError("존재하지 않는 신청입니다.");
  if (app.status !== "pending") throw new ApplicationError("이미 처리된 신청입니다.");
}

// 모집글 삭제 시 취소 알림을 받을 신청자 (대기·수락 상태, 중복 제거)
export function applicantsToNotifyOnDelete(
  apps: Pick<Application, "applicantId" | "status">[],
): string[] {
  const ids = apps
    .filter((app) => app.status === "pending" || app.status === "accepted")
    .map((app) => app.applicantId);
  return [...new Set(ids)];
}

// 마감 시 "모집 마감" 처리할 대기 중 신청
export function pendingApplications<T extends Pick<Application, "status">>(apps: T[]): T[] {
  return apps.filter((app) => app.status === "pending");
}

export function assertCanReopen(
  post: (PostState & Pick<RecruitPost, "date" | "time">) | undefined,
): void {
  if (!post) throw new ApplicationError("존재하지 않는 모집글입니다.");
  if (post.status === "open") throw new ApplicationError("이미 모집 중입니다.");
  if (isPostExpired(post.date, post.time)) {
    throw new ApplicationError("경기 시간이 지난 모집은 다시 열 수 없습니다.");
  }
  if ((post.acceptedCount ?? 0) >= post.needCount) {
    throw new ApplicationError("모집 인원이 모두 찼습니다. 모집 인원을 늘린 뒤 다시 열어주세요.");
  }
}

// 수락 후 수락 인원을 반환하고, 정원이 차면 마감 대상으로 표시한다
export function nextAcceptState(post: PostState | undefined): {
  acceptedCount: number;
  shouldClose: boolean;
} {
  if (!post) throw new ApplicationError("존재하지 않는 모집글입니다.");
  if (post.status !== "open") throw new ApplicationError("마감된 모집입니다.");

  const current = post.acceptedCount ?? 0;
  if (current >= post.needCount) throw new ApplicationError("모집 인원이 모두 찼습니다.");

  const acceptedCount = current + 1;
  return { acceptedCount, shouldClose: acceptedCount >= post.needCount };
}
