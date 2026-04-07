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
    <main>
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-12 px-6 pb-20 pt-12 md:flex-row">
        <div className="flex-1 text-center md:text-left">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-rose-400">지금 피어있는 곳</p>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-[#1A1A1A] md:text-5xl">
            봄꽃 명소를
            <br />
            감성 있게, 빠르게
          </h1>
          <p className="mb-10 max-w-md text-lg leading-relaxed text-gray-500 md:mx-0">
            전국의 꽃 명소를 지도와 리스트로 비교하고, 개화 시기에 맞춰 딱 맞는 나들이를 계획해보세요.
            <br />
            <span className="text-base text-rose-400">앱을 설치하면 언제 어디서든 바로 확인할 수 있어요.</span>
          </p>
          <div className="mb-4 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Link
              href="https://apps.apple.com/kr/app/%EA%BD%83-%EC%96%B4%EB%94%94/id6761335543"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#333]"
            >
              <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              App Store
            </Link>
            <Link
              href="https://play.google.com/store/apps/details?id=com.kkoteodi.mobile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C45C7E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B04F70]"
            >
              <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.18 23.76c.3.17.64.22.97.15l12.45-7.2-2.78-2.78-10.64 9.83zm-1.8-20.3v17.08c0 .56.32 1.05.8 1.3l11.93-11.93L2.18 3.46c-.48.25-.8.74-.8 1.3zm20.4 7.77l-2.85-1.65-3.12 3.12 3.12 3.12 2.88-1.66c.82-.47.82-1.63-.03-2.93zM4.15.4L16.6 7.6 13.82 10.38 1.37.55C1.67.23 2.09.06 2.53.06c.56 0 1.1.13 1.62.34z" />
              </svg>
              Google Play
            </Link>
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 scale-90 rounded-[48px] bg-rose-100 opacity-40 blur-3xl" />
          <div className="relative w-[240px] overflow-hidden rounded-[40px] border border-rose-100 shadow-2xl">
            <Image alt="꽃 어디 앱 스크린샷" height={520} src="/images/main.png" width={240} />
          </div>
        </div>
      </section>

      <section className="bg-[#FFF4F6] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-rose-400">Features</p>
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-[#1A1A1A] md:text-3xl">
            꽃 어디만의 기능
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-rose-50 bg-white p-7 shadow-sm">
                <span className="mb-4 block text-3xl">{feature.icon}</span>
                <h3 className="mb-2 text-lg font-bold text-[#1A1A1A]">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
