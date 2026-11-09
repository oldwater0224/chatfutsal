import Script from "next/script";
import "./globals.css";
import { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import ErrorBoundary from "../components/ErrorBoundary";
import { AppDataProvider } from "../contexts/AppDataContext";

const DESCRIPTION = "풋살 용병 모집, 참가 신청, 1:1 채팅";

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
  weight: ["400", "500", "600"],
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

          <AppDataProvider>{children}</AppDataProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
