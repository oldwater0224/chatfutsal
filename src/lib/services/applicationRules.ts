// 참가 신청 상태 전이 검증 (Firebase 의존성 없는 순수 함수)
// 트랜잭션 안에서 읽은 최신 문서로 판단해야 동시 요청에도 정원·중복이 지켜진다

import { Application, RecruitPost } from "../../types";
import { isPostExpired } from "../utils/dateUtils";

type PostState = Pick<RecruitPost, "status" | "needCount"> &
  Partial<Pick<RecruitPost, "acceptedCount" | "applicantIds">>;

// 대기 신청 정리 판단에는 정원(needCount)이 필요하지 않다
type ClosableState = Pick<RecruitPost, "status"> &
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

// 마감된 글에 정리되지 않은 대기 신청이 남아 있는지.
// applicantIds는 대기 + 수락 신청자이고 acceptedCount는 수락 인원이므로, 둘의 차이가 대기 인원이다.
// (거절·취소·마감 처리된 신청자는 applicantIds에서 빠진다)
export function hasUnclearedPendingApplications(post: ClosableState | undefined): boolean {
  if (!post || post.status !== "closed") return false;
  return (post.applicantIds?.length ?? 0) > (post.acceptedCount ?? 0);
}

// 작성자 화면에서 뒤늦게 정리해야 할 모집글.
// 경기 시간 경과로 인한 자동 마감은 아무 로그인 사용자가 수행하는데, 그 사용자는 남의 신청 문서를
// 바꿀 권한이 없어 대기 신청이 남는다. 권한이 있는 작성자가 자기 글을 볼 때 정리한다.
export function selectPostsToCleanup<
  T extends ClosableState & Pick<RecruitPost, "id" | "title">,
>(posts: T[], attemptedIds: ReadonlySet<string>): T[] {
  return posts.filter(
    (post) => !attemptedIds.has(post.id) && hasUnclearedPendingApplications(post),
  );
}

// 신청 목록에 표시할 상태. 모집글이 마감됐는데 신청이 아직 pending이면
// 정리 쓰기가 반영되기 전이므로 화면에서는 "모집 마감"으로 보여준다.
export function displayApplicationStatus(
  applicationStatus: Application["status"],
  postStatus: RecruitPost["status"] | undefined,
): Application["status"] {
  if (applicationStatus === "pending" && postStatus === "closed") return "closed";
  return applicationStatus;
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
