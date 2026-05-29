import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Provider as JotaiProvider } from 'jotai';
import TokenExpireWatcher from "@/components/TokenExpireWatcher";
import ConditionalNav from "@/components/Nav/ConditionalNav";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * 서비스 메타데이터 설정 (SEO 최적화)
 */
export const metadata: Metadata = {
  title: "Gridwiz | EvCharging",
  description: "스마트한 전기차 충전 수요 예측 및 관리 플랫폼",
};

/**
 * 애플리케이션 최상위 루트 레이아웃
 * HTML 문서의 기본 구조를 정의하며, 폰트, 전역 상태(Jotai), 인증 감시자 및 
 * 조건부 네비게이션을 포함한 공통 UI 구성을 관리합니다.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <JotaiProvider>
          {/* 세션 만료 감시 컴포넌트 */}
          <TokenExpireWatcher />
          <Script
            src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JSKEY}&autoload=false&libraries=services,clusterer`}
            strategy="beforeInteractive" // 지도 사용 전 로드 보장
          />
          <header className="fixed top-0 left-0 w-full z-50">
            <ConditionalNav />
          </header>
          <main>
            {children}
            {/* 사용자 편의 기능: 상단 이동 버튼 */}
            <ScrollToTopButton />
          </main>
        </JotaiProvider>
      </body>
    </html>
  );
}
