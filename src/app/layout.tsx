import Script from "next/script";
import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChatFutsal",
  description: "풋살 매치 & 채팅 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {/* ✅ body 안에 Script 배치 (head 아님!) */}
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY}&autoload=false`}
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}