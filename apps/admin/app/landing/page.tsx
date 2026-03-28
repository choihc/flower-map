import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  const features = [
    {
      icon: '🗺️',
      title: '지도로 한눈에',
      description: '지금 피어있는 꽃 명소를 지도에서 바로 확인하고 비교해보세요.',
    },
    {
      icon: '🌸',
      title: '꽃 종류별 탐색',
      description: '벚꽃, 유채꽃, 진달래 등 원하는 꽃 종류만 필터링해 볼 수 있어요.',
    },
    {
      icon: '📅',
      title: '개화 시기 안내',
      description: '축제 일정과 종료 임박 명소를 미리 알려드려 놓치지 않게 도와드려요.',
    },
    {
      icon: '❤️',
      title: '명소 저장',
      description: '마음에 드는 명소를 저장하고 나만의 봄나들이 리스트를 만들어보세요.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF9]">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <span className="text-xl font-bold text-[#1A1A1A] tracking-tight">꽃 어디</span>
        <nav className="flex items-center gap-6 text-sm text-gray-500">
          <Link href="/support" className="hover:text-[#1A1A1A] transition-colors">지원</Link>
          <Link href="/privacy" className="hover:text-[#1A1A1A] transition-colors">개인정보처리방침</Link>
        </nav>
      </header>

      {/* 히어로 */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-20 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm font-semibold text-rose-400 tracking-widest uppercase mb-4">지금 피어있는 곳</p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] leading-tight tracking-tight mb-6">
            봄꽃 명소를<br />감성 있게, 빠르게
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-md mx-auto md:mx-0">
            전국의 꽃 명소를 지도와 리스트로 비교하고,
            개화 시기에 맞춰 딱 맞는 나들이를 계획해보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <div className="flex items-center gap-3 bg-[#1A1A1A] text-white rounded-2xl px-6 py-4 opacity-50 cursor-not-allowed select-none">
              <span className="text-2xl leading-none">🍎</span>
              <div className="text-left">
                <p className="text-xs text-gray-400">Coming Soon</p>
                <p className="text-sm font-semibold">App Store</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#1A1A1A] text-white rounded-2xl px-6 py-4 opacity-50 cursor-not-allowed select-none">
              <span className="text-2xl leading-none">▶</span>
              <div className="text-left">
                <p className="text-xs text-gray-400">Coming Soon</p>
                <p className="text-sm font-semibold">Google Play</p>
              </div>
            </div>
          </div>
        </div>

        {/* 앱 스크린샷 */}
        <div className="flex-shrink-0 relative">
          <div className="absolute inset-0 bg-rose-100 rounded-[48px] blur-3xl opacity-40 scale-90" />
          <div className="relative rounded-[40px] overflow-hidden shadow-2xl border border-rose-100 w-[240px]">
            <Image
              alt="꽃 어디 앱 스크린샷"
              height={520}
              src="/images/main.png"
              width={240}
            />
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="bg-[#FFF4F6] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-semibold text-rose-400 tracking-widest uppercase text-center mb-3">Features</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] text-center mb-12 tracking-tight">
            꽃 어디만의 기능
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-3xl p-7 border border-rose-50 shadow-sm">
                <span className="text-3xl mb-4 block">{feature.icon}</span>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-12 px-6 text-center text-sm text-gray-400 space-y-3">
        <p className="font-semibold text-[#1A1A1A]">꽃 어디</p>
        <div className="flex justify-center gap-5">
          <Link href="/privacy" className="hover:text-[#1A1A1A] transition-colors">개인정보처리방침</Link>
          <Link href="/support" className="hover:text-[#1A1A1A] transition-colors">지원</Link>
        </div>
        <p>© 2026 넥스트바인. All rights reserved.</p>
        <p>nextvine.flow@gmail.com</p>
      </footer>
    </div>
  );
}
