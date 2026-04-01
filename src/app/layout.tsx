import Script from "next/script";
import "./globals.css";
import { Metadata } from "next";
<<<<<<< HEAD
=======
import {Noto_Sans_KR} from "next/font/google";
>>>>>>> ffc5b7a1662e590ccb683fb96f33a18bf9771d53
import ErrorBoundary from "../components/ErrorBoundary";

export const metadata: Metadata = {
  title: "ChatFutsal",
  description: "풋살 매치 & 채팅 플랫폼",
};
<<<<<<< HEAD
=======
const notoSansKR = Noto_Sans_KR({
  subsets : ["latin"],
  weight : ["400", "500","700"],
  display : "swap",
})
>>>>>>> ffc5b7a1662e590ccb683fb96f33a18bf9771d53

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="ko">
<<<<<<< HEAD
      <body>
=======
      <body className={`${notoSansKR.className}`}>
>>>>>>> ffc5b7a1662e590ccb683fb96f33a18bf9771d53
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
