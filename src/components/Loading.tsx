import { spinnerClass } from "./ui/styles";

export default function Loading({ text = "불러오는 중" }: { text?: string }) {
  return (
    <div role="status" className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className={spinnerClass} aria-hidden="true" />
      <p className="text-[13px] text-gray-600">{text}</p>
    </div>
  );
}
