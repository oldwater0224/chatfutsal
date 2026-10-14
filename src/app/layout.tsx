import Script from "next/script";
import "./globals.css";
import { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import ErrorBoundary from "../components/ErrorBoundary";

const DESCRIPTION = "풋살 용병 모집부터 참가 신청, 1:1 실시간 채팅까지 한 곳에서";

export const metadata: Metadata = {
  title: {
    default: "ChatFutsal",
    template: "%s | ChatFutsal",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "ChatFutsal",
    description: DESCRIPTION,
    siteName: "ChatFutsal",
    locale: "ko_KR",
    type: "website",
  },
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
