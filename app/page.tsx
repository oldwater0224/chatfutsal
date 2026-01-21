import { Card, CardAction } from "@/components/ui/card";

export default function Home() {
  return (
    <>
      <div className="flex justify-center">
        <header className="flex bg-red-600">CHATFUTSAL</header>
      </div>
      <div className="h-100">
        <main className="bg-green-600">소통하며 풋살하자 CHATFUTSAL</main>
      </div>
      <div>
        <footer className="bg-blue-500">2026 chatfutsal</footer>
      </div>
    </>
  );
}
