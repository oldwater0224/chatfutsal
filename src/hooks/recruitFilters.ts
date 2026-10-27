// 모집글 필터 중 Firestore 쿼리(등호 조건)로 거를 수 있는 것.
// 지역(주소 부분 일치)·검색어(제목·내용 부분 일치)는 쿼리로 표현할 수 없어 클라이언트에서 거른다.
// 순서는 firestore.indexes.json의 복합 색인 필드 순서(status → date → level → createdAt)와 맞춘다.
export function serverFilterConstraints(filters: {
  date?: string;
  level?: string;
}): [field: "date" | "level", value: string][] {
  const constraints: [field: "date" | "level", value: string][] = [];
  if (filters.date) constraints.push(["date", filters.date]);
  if (filters.level) constraints.push(["level", filters.level]);
  return constraints;
}
