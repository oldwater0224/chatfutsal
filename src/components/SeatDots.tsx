// 자리 칸: 모집 인원을 칸으로 그려 남은 자리를 한눈에 보여준다.
// 찬 자리는 회색, 남은 자리는 초록(강조색)으로 칠해 "아직 들어갈 수 있는 자리"가 먼저 읽히게 한다.
// 칸은 원이 아니라 작은 사각형이라 알림의 읽지 않음 점과 헷갈리지 않는다.

const MAX_CELLS = 12;

const SIZES = {
  sm: { cell: "w-2 h-2 rounded-[2px]", gap: "gap-1", bar: "w-16 h-2" },
  md: { cell: "w-4 h-4 rounded-sm", gap: "gap-1", bar: "w-40 h-3" },
};

interface SeatDotsProps {
  filled: number;
  total: number;
  size?: "sm" | "md";
  /** 마감된 글: 남은 자리도 회색 테두리로만 그린다 */
  closed?: boolean;
}

export default function SeatDots({ filled, total, size = "sm", closed = false }: SeatDotsProps) {
  const safeTotal = Math.max(Math.floor(total), 0);
  if (safeTotal === 0) return null;
  const safeFilled = Math.min(Math.max(Math.floor(filled), 0), safeTotal);
  const s = SIZES[size];
  const label = `${safeTotal}자리 중 ${safeFilled}자리 참`;
  const openClass = closed ? "border border-gray-300" : "bg-green-600";

  // 칸이 너무 많으면 같은 색 구성의 막대 하나로 줄인다
  if (safeTotal > MAX_CELLS) {
    return (
      <span
        role="img"
        aria-label={label}
        className={`relative inline-block shrink-0 overflow-hidden rounded-sm ${s.bar} ${
          closed ? "bg-gray-100" : "bg-green-600"
        }`}
      >
        <span
          className="absolute inset-y-0 left-0 bg-gray-300"
          style={{ width: `${(safeFilled / safeTotal) * 100}%` }}
        />
      </span>
    );
  }

  return (
    <span role="img" aria-label={label} className={`inline-flex shrink-0 items-center ${s.gap}`}>
      {Array.from({ length: safeTotal }, (_, i) => (
        <span key={i} className={`${s.cell} ${i < safeFilled ? "bg-gray-300" : openClass}`} />
      ))}
    </span>
  );
}
