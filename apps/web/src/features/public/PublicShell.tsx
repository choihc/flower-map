import Link from 'next/link';
import type { ReactNode } from 'react';

type PublicShellProps = {
  children: ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#191F28]">
      <header className="sticky top-0 z-20 border-b border-[#F3D8E2] bg-[#FFFDF9]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="space-y-1">
            <Link href="/" className="text-xl font-bold tracking-tight text-[#1A1A1A]">
              꽃 어디
            </Link>
            <p className="text-xs text-[#8B5A6E]">지금 피어있는 계절의 동선을 빠르게 찾으세요</p>
          </div>
          <nav className="hidden items-center gap-5 text-sm text-gray-500 md:flex">
            <Link href="/map" className="transition-colors hover:text-[#1A1A1A]">지도</Link>
            <Link href="/search" className="transition-colors hover:text-[#1A1A1A]">검색</Link>
            <Link href="/support" className="transition-colors hover:text-[#1A1A1A]">지원</Link>
            <Link href="/privacy" className="transition-colors hover:text-[#1A1A1A]">개인정보처리방침</Link>
          </nav>
        </div>
      </header>

      <div className="pb-24 md:pb-0">{children}</div>

      <footer className="border-t border-[#F3D8E2] px-6 py-10 text-center text-sm text-gray-400">
        <p className="font-semibold text-[#1A1A1A]">꽃 어디</p>
        <div className="mt-3 flex justify-center gap-5">
          <Link href="/support" className="transition-colors hover:text-[#1A1A1A]">지원</Link>
          <Link href="/privacy" className="transition-colors hover:text-[#1A1A1A]">개인정보처리방침</Link>
        </div>
        <p className="mt-3">© 2026 넥스트바인. All rights reserved.</p>
      </footer>

      <nav className="fixed inset-x-4 bottom-4 z-20 rounded-[28px] border border-[#F3D8E2] bg-white/95 px-4 py-3 shadow-[0_14px_40px_rgba(196,92,126,0.14)] backdrop-blur md:hidden">
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-[#8B5A6E]">
          <Link href="/" className="rounded-2xl px-3 py-2 transition-colors hover:bg-[#FFF4F6]">홈</Link>
          <Link href="/map" className="rounded-2xl px-3 py-2 transition-colors hover:bg-[#FFF4F6]">지도</Link>
          <Link href="/search" className="rounded-2xl px-3 py-2 transition-colors hover:bg-[#FFF4F6]">검색</Link>
        </div>
      </nav>
    </div>
  );
}
