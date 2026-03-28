import Link from 'next/link';

const faqs = [
  {
    q: '꽃 어디는 어떤 앱인가요?',
    a: '전국의 봄꽃 명소를 지도와 리스트로 탐색하고, 개화 시기에 맞는 나들이를 계획할 수 있는 앱이에요.',
  },
  {
    q: '개화 정보는 얼마나 자주 업데이트되나요?',
    a: '운영팀이 직접 수집한 정보를 기반으로 시즌 중 주기적으로 업데이트하고 있어요. 실시간 개화 정보와 다소 차이가 있을 수 있습니다.',
  },
  {
    q: '저장한 명소가 사라졌어요.',
    a: '현재 저장 기능은 계정 연동을 통해 동기화됩니다. 로그아웃 후 재로그인하거나, 앱을 재설치한 경우 저장 내역이 초기화될 수 있어요. 문제가 지속되면 아래 이메일로 문의해주세요.',
  },
  {
    q: '앱이 정상적으로 실행되지 않아요.',
    a: '앱을 완전히 종료 후 재실행하거나, 최신 버전으로 업데이트해보세요. 그래도 문제가 해결되지 않으면 아래 이메일로 기기 정보와 함께 문의해 주시면 빠르게 도와드릴게요.',
  },
  {
    q: '명소 정보가 잘못되었어요.',
    a: '아래 이메일로 해당 명소 이름과 수정이 필요한 내용을 보내주시면 검토 후 반영하겠습니다.',
  },
  {
    q: '앱스토어 출시는 언제인가요?',
    a: '현재 심사 준비 중이에요. 출시 소식은 앱 내 공지를 통해 안내드릴 예정입니다.',
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] py-16 px-6">
      <div className="max-w-2xl mx-auto">

        {/* 헤더 */}
        <div className="mb-10">
          <Link href="/landing" className="text-sm text-gray-400 hover:text-[#1A1A1A] transition-colors mb-4 inline-block">
            ← 꽃 어디
          </Link>
          <p className="text-sm font-semibold text-rose-400 tracking-widest uppercase mb-2">Support</p>
          <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight">도움이 필요하신가요?</h1>
          <p className="mt-3 text-gray-500">
            자주 묻는 질문을 먼저 확인해보시고, 해결이 안 되면 이메일로 문의해 주세요.
          </p>
        </div>

        {/* 문의 카드 */}
        <div className="bg-[#FFF4F6] border border-rose-100 rounded-3xl p-6 mb-12 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-[#1A1A1A] mb-1">이메일로 문의하기</p>
            <p className="text-sm text-gray-500">평균 1–2 영업일 내 답변드려요.</p>
          </div>
          <a
            href="mailto:nextvine.flow@gmail.com"
            className="flex-shrink-0 bg-[#1A1A1A] text-white text-sm font-semibold rounded-2xl px-5 py-3 hover:bg-gray-800 transition-colors"
          >
            문의하기
          </a>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-6">자주 묻는 질문</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <p className="font-semibold text-[#1A1A1A] mb-2 flex items-start gap-2">
                  <span className="text-rose-300 mt-0.5 flex-shrink-0">✿</span>
                  {faq.q}
                </p>
                <p className="text-gray-500 text-sm leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 링크 */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex justify-center gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-[#1A1A1A] transition-colors">개인정보처리방침</Link>
          <Link href="/landing" className="hover:text-[#1A1A1A] transition-colors">앱 소개</Link>
        </div>
      </div>
    </div>
  );
}
