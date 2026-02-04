import Script from "next/script";
import "./globals.css";
import { Metadata } from "next";
import ErrorBoundary from "../components/ErrorBoundary";

export const metadata: Metadata = {
  title: "ChatFutsal",
  description: "풋살 매치 & 채팅 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("Kakao Key:", process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY);
  return (
    <html lang="ko">
      <body>
        <ErrorBoundary>
          <Script
            src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY}&autoload=false`}
            strategy="beforeInteractive"
          />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
