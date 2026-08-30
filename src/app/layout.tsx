import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "./actions/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "stay — 어디에나, 내 집처럼",
  description: "숙소를 등록하고 예약하는 가장 간단한 방법",
};

async function Header() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand">
          stay
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              <Link
                href="/host/new"
                className="rounded-full px-3 py-2 font-medium hover:bg-black/5"
              >
                숙소 등록하기
              </Link>
              <Link
                href="/host"
                className="rounded-full px-3 py-2 font-medium hover:bg-black/5"
              >
                내 숙소
              </Link>
              <Link
                href="/bookings"
                className="rounded-full px-3 py-2 font-medium hover:bg-black/5"
              >
                내 예약
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-2 text-muted hover:bg-black/5"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-line px-4 py-2 font-medium hover:shadow-md"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        {/* 환경변수가 없으면 어떤 라우트도 Supabase 를 건드리지 않게 여기서 가로챕니다 */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {isSupabaseConfigured ? children : <SetupNotice />}
        </main>
        <footer className="border-t border-line py-8 text-center text-sm text-muted">
          stay — 연습용 프로젝트입니다. 실제 결제는 이뤄지지 않습니다.
        </footer>
      </body>
    </html>
  );
}
