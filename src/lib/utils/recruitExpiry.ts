import { RecruitPost } from "../../types";
import { isPostExpired } from "./dateUtils";

type ClosablePost = Pick<RecruitPost, "id" | "date" | "time" | "status">;

// Firestore에서도 마감 처리해야 하는 모집글의 id를 고른다.
// 이미 시도한 글은 제외해 같은 세션에서 글마다 한 번만 쓰도록 한다.
export function selectPostsToClose(
  posts: ClosablePost[],
  attemptedIds: ReadonlySet<string>,
): string[] {
  return posts
    .filter(
      (post) =>
        post.status === "open" &&
        !attemptedIds.has(post.id) &&
        isPostExpired(post.date, post.time),
    )
    .map((post) => post.id);
}
