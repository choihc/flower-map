export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-sm font-semibold text-rose-400 tracking-widest uppercase mb-2">꽃 어디</p>
          <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight">개인정보 처리방침</h1>
          <p className="mt-3 text-sm text-gray-400">최종 수정일: 2026년 3월 28일</p>
        </div>

        <div className="space-y-10 text-[15px] leading-relaxed text-[#3D3D3D]">

          <section>
            <p>
              넥스트바인(이하 &quot;회사&quot;)은 &quot;꽃 어디&quot; 서비스(이하 &quot;서비스&quot;) 운영 시 이용자의 개인정보를
              소중히 여기며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
              본 방침을 통해 수집하는 개인정보의 항목, 수집 목적, 보유 기간 및 이용자 권리를 안내합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">1. 수집하는 개인정보 항목</h2>
            <p className="mb-3">서비스 이용 과정에서 아래와 같은 정보를 수집합니다.</p>
            <div className="bg-[#FFF4F6] border border-rose-100 rounded-2xl p-5 space-y-3">
              <div>
                <p className="font-semibold text-[#1A1A1A] mb-1">카카오 소셜 로그인 시</p>
                <p className="text-gray-500 text-sm">카카오 계정 이메일, 고유 식별자(UID)</p>
              </div>
              <div>
                <p className="font-semibold text-[#1A1A1A] mb-1">서비스 이용 시 자동 수집</p>
                <p className="text-gray-500 text-sm">앱 버전, 접속 기기 정보, 서비스 이용 기록</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">2. 개인정보 수집 및 이용 목적</h2>
            <ul className="space-y-2 list-none">
              {[
                '로그인 및 회원 식별',
                '저장한 명소 동기화 및 개인화 서비스 제공',
                '서비스 개선 및 오류 대응',
                '공지사항 및 정책 변경 안내',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-rose-300 mt-0.5">✿</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">3. 개인정보 보유 및 이용 기간</h2>
            <p className="mb-3">
              회원 탈퇴 시 즉시 파기합니다. 단, 관련 법령에 의해 보존 의무가 있는 경우 해당 기간 동안 보관합니다.
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden text-sm">
              <div className="grid grid-cols-2 font-semibold text-gray-500 bg-gray-100 px-5 py-3">
                <span>보존 항목</span>
                <span>보존 기간</span>
              </div>
              {[
                ['서비스 이용 기록', '1년 (통신비밀보호법)'],
                ['전자상거래 기록', '5년 (전자상거래법)'],
              ].map(([item, period]) => (
                <div key={item} className="grid grid-cols-2 px-5 py-3 border-t border-gray-100">
                  <span className="text-gray-700">{item}</span>
                  <span className="text-gray-500">{period}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">4. 개인정보의 파기</h2>
            <p>
              보유 기간이 만료되거나 처리 목적이 달성된 개인정보는 즉시 파기합니다.
              전자파일 형태의 정보는 복구 불가능한 방법으로 삭제하며,
              출력물 등은 분쇄 또는 소각하여 파기합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">5. 이용자의 권리</h2>
            <p className="mb-3">이용자는 언제든지 아래 권리를 행사할 수 있습니다.</p>
            <ul className="space-y-2">
              {[
                '개인정보 열람 요청',
                '오류 정정 요청',
                '삭제 및 처리 정지 요청',
                '동의 철회 (회원 탈퇴)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-rose-300 mt-0.5">✿</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-gray-500 text-sm">
              권리 행사는 아래 개인정보 보호책임자에게 이메일로 요청하시면 지체 없이 처리해 드립니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">6. 개인정보 보호책임자</h2>
            <div className="bg-[#FFF4F6] border border-rose-100 rounded-2xl p-5 text-sm space-y-1">
              <p><span className="font-semibold text-[#1A1A1A]">책임자</span> <span className="text-gray-500 ml-2">넥스트바인 개인정보 담당</span></p>
              <p><span className="font-semibold text-[#1A1A1A]">이메일</span> <span className="text-gray-500 ml-2">nextvine.flow@gmail.com</span></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">7. 방침 변경 안내</h2>
            <p>
              본 방침은 법령 또는 서비스 정책에 따라 변경될 수 있으며,
              변경 시 앱 내 공지 또는 본 페이지를 통해 사전 안내합니다.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
          꽃 어디 · 넥스트바인 · nextvine.flow@gmail.com
        </div>
      </div>
    </div>
  );
}
