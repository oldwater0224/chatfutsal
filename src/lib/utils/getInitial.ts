// 아바타 등에 쓸 이름의 첫 글자. 사람이 한 글자로 보는 단위(grapheme)로 자르므로
// "⚽️풋살"은 "⚽️", "👨‍👩‍👧 가족"은 가족 이모지 전체, "🇰🇷"는 국기 전체를 돌려준다.
// Intl.Segmenter가 없는 환경에서는 코드 포인트 단위로 잘라 반쪽 서로게이트만은 돌려주지 않는다.
const segmenter: Intl.Segmenter | null =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

export function firstCodePoint(text: string): string {
  return Array.from(text)[0] ?? "";
}

export function getInitial(name: string | null | undefined, fallback = "?"): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return fallback;

  if (segmenter) {
    const first = segmenter.segment(trimmed)[Symbol.iterator]().next();
    if (!first.done && first.value.segment) return first.value.segment;
  }
  return firstCodePoint(trimmed) || fallback;
}
