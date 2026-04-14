import Script from "next/script";
import "./globals.css";
import { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import ErrorBoundary from "../components/ErrorBoundary";

export const metadata: Metadata = {
  title: "ChatFutsal",
  description: "풋살 매치 & 채팅 플랫폼",
};
const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.className}`}>
        <ErrorBoundary>
          <Script
            src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY}&libraries=services&autoload=false`}
            strategy="beforeInteractive"
          />

          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
