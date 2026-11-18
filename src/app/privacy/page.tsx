import type { Metadata } from "next";
import type { ReactNode } from "react";
import SubHeader from "@/src/components/SubHeader";
import { focusRingClass } from "@/src/components/ui/styles";
import { LEGAL_INFO, legalValue } from "@/src/lib/legal/legalInfo";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
};

// 정해지지 않은 값은 legalValue로 감싸 "(추후 기재)"로 보이게 한다. 이 파일에 직접 적지 않는다

const SECTIONS = [
  { id: "purpose", title: "개인정보의 처리 목적" },
  { id: "items", title: "처리하는 개인정보 항목" },
  { id: "basis", title: "개인정보의 처리 근거" },
  { id: "retention", title: "개인정보의 처리 및 보유 기간" },
  { id: "public", title: "다른 이용자에게 공개되는 정보" },
  { id: "third-party", title: "개인정보의 제3자 제공" },
  { id: "outsourcing", title: "개인정보 처리의 위탁" },
  { id: "overseas", title: "개인정보의 국외 이전" },
  { id: "destruction", title: "개인정보의 파기 절차와 방법" },
  { id: "children", title: "만 14세 미만 아동의 개인정보" },
  { id: "rights", title: "이용자의 권리와 행사 방법" },
  { id: "security", title: "개인정보의 안전성 확보 조치" },
  { id: "auto-collect", title: "개인정보 자동 수집 장치의 설치·운영과 거부" },
  { id: "marketing", title: "광고성 정보 전송" },
  { id: "officer", title: "개인정보 보호책임자" },
  { id: "remedy", title: "권익침해 구제 방법" },
  { id: "changes", title: "개인정보 처리방침의 변경" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const bodyClass = "text-[15px] leading-relaxed text-gray-900";
const linkClass = `text-green-700 underline underline-offset-2 rounded-sm ${focusRingClass}`;

function Section({ id, children }: { id: SectionId; children: ReactNode }) {
  const index = SECTIONS.findIndex((s) => s.id === id);
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 pt-8">
      <h2 id={`${id}-title`} className="text-[17px] font-semibold text-gray-900">
        {index + 1}. {SECTIONS[index].title}
      </h2>
      <div className={`mt-3 space-y-3 ${bodyClass}`}>{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 marker:text-gray-400">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** 표 대신 쓰는 카드형 정의 목록. 좁은 화면에서도 가로 스크롤 없이 읽힌다 */
function InfoCard({ title, rows }: { title: string; rows: { label: string; value: ReactNode }[] }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
      <dl className="mt-3 space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="sm:grid sm:grid-cols-[8rem_1fr] sm:gap-3">
            <dt className="text-[13px] font-medium text-gray-500">{label}</dt>
            <dd className="mt-0.5 sm:mt-0 text-[15px] text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const OUTSOURCING: { name: string; tasks: ReactNode }[] = [
  {
    name: "Google LLC",
    tasks:
      "회원 인증(Firebase Authentication), 데이터 저장(Cloud Firestore), 푸시 알림 발송(Firebase Cloud Messaging)",
  },
  { name: "Vercel Inc.", tasks: "웹 서비스 호스팅, 서버 실행 및 로그 처리" },
  { name: "(주)카카오", tasks: "카카오 로그인 인증, 지도 표시와 장소 검색" },
  {
    name: "이용자 브라우저의 푸시 서비스(Apple, Google, Mozilla 등)",
    tasks: "브라우저 푸시 알림 전달 (이용자가 알림을 켠 경우)",
  },
];

const OVERSEAS_COMMON = {
  when: "서비스 이용 시 네트워크를 통해 전송",
  purpose: "7. 개인정보 처리의 위탁에 적힌 위탁 업무",
  period: "회원 탈퇴 또는 위탁 계약 종료 시까지",
};

const REMEDY: { name: string; phone: string; site: string }[] = [
  { name: "개인정보분쟁조정위원회", phone: "(국번 없이) 1833-6972", site: "www.kopico.go.kr" },
  { name: "개인정보침해신고센터", phone: "(국번 없이) 118", site: "privacy.kisa.or.kr" },
  { name: "대검찰청", phone: "(국번 없이) 1301", site: "www.spo.go.kr" },
  { name: "경찰청", phone: "(국번 없이) 182", site: "ecrm.police.go.kr" },
];

export default function PrivacyPage() {
  const {
    serviceName,
    privacyOfficer,
    contactEmail,
    firestoreRegion,
    vercelRegion,
    googlePrivacyContact,
    vercelPrivacyContact,
    privacyEffectiveDate,
  } = LEGAL_INFO;

  return (
    <div className="min-h-screen bg-white">
      <SubHeader title="개인정보 처리방침" backHref="/" />

      <main className="pt-14 pb-12 max-w-2xl mx-auto px-4 break-keep wrap-break-word">
        <p className={`pt-6 ${bodyClass}`}>
          {serviceName}(이하 &lsquo;서비스&rsquo;)는 「개인정보 보호법」에 따라 이용자의 개인정보를 보호하고 관련
          고충을 원활하게 처리하기 위해 다음과 같이 개인정보 처리방침을 둡니다.
        </p>

        <nav aria-labelledby="toc-title" className="mt-6 rounded-xl bg-gray-50 p-4">
          <h2 id="toc-title" className="text-[13px] font-medium text-gray-500">
            목차
          </h2>
          <ol className="mt-2 space-y-1.5 text-[13px]">
            {SECTIONS.map(({ id, title }, i) => (
              <li key={id}>
                <a href={`#${id}`} className={`text-gray-600 hover:text-gray-900 hover:underline rounded-sm ${focusRingClass}`}>
                  {i + 1}. {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Section id="purpose">
          <p>서비스는 다음 목적을 위해 개인정보를 처리합니다.</p>
          <Bullets
            items={[
              "회원 가입과 관리: 본인 식별, 부정 이용 방지",
              "서비스 제공: 풋살 모집글 작성·조회, 참가 신청·수락, 채팅, 알림·푸시 알림",
              "문의 처리",
            ]}
          />
        </Section>

        <Section id="items">
          <div>
            <h3 className="font-semibold">이메일로 가입하는 경우</h3>
            <p className="mt-1">
              이메일, 비밀번호(암호화되어 저장되며 서비스도 볼 수 없습니다), 닉네임
            </p>
          </div>
          <div>
            <h3 className="font-semibold">카카오 로그인을 이용하는 경우</h3>
            <p className="mt-1">
              카카오 회원번호, 닉네임 (카카오가 제공하는 그 밖의 정보는 저장하지 않습니다)
            </p>
          </div>
          <div>
            <h3 className="font-semibold">서비스 이용 중 생성되는 정보</h3>
            <div className="mt-1">
              <Bullets
                items={[
                  "모집글: 제목, 경기 일시, 구장 이름·주소·좌표, 실력 수준, 모집 인원, 내용",
                  "참가 신청 메시지",
                  "채팅 메시지",
                  "알림 내역",
                  "푸시 알림 토큰 (이용자가 푸시 알림을 켠 경우)",
                ]}
              />
            </div>
          </div>
          <div>
            <h3 className="font-semibold">자동으로 수집되는 정보</h3>
            <p className="mt-1">
              접속 기록(IP 주소, 브라우저 정보, 접속 일시). 호스팅 사업자의 서버 로그로 생성됩니다.
            </p>
          </div>
        </Section>

        <Section id="basis">
          <p>
            서비스 제공에 필요한 개인정보는 이용 계약을 이행하기 위해 처리합니다(「개인정보 보호법」 제15조 제1항
            제4호).
          </p>
          <p>
            별도의 선택 수집 항목은 없습니다. 푸시 알림 토큰은 이용자가 알림을 켤 때만 수집합니다.
          </p>
        </Section>

        <Section id="retention">
          <p>
            개인정보는 회원 탈퇴 시까지 보유하며, 탈퇴하면 지체 없이 파기합니다. 다만 알림 내역은 생성 후 90일이 지나면
            자동으로 삭제됩니다.
          </p>
          <p>관계 법령에 따라 다음 정보는 정해진 기간 동안 보존합니다.</p>
          <Bullets items={["「통신비밀보호법」에 따른 접속 기록(로그인 기록): 3개월"]} />
        </Section>

        <Section id="public">
          <p>다음 정보는 다른 이용자에게 공개됩니다.</p>
          <Bullets
            items={[
              "닉네임",
              "가입 방식(카카오/이메일)",
              "작성한 모집글 (구장 정보와 신청 인원, 참가 신청한 이용자 정보 포함)",
            ]}
          />
          <p>
            참가 신청 내역과 신청 메시지는 신청자 본인과 해당 모집글 작성자에게만 보입니다. 채팅 메시지는 채팅
            참여자에게만 보입니다. 이메일은 공개하지 않습니다.
          </p>
          <p className="font-medium">모집글 내용에 연락처 등 개인정보를 적지 않도록 주의해 주세요.</p>
        </Section>

        <Section id="third-party">
          <p>
            서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 특별한 규정이 있는 경우 등
            「개인정보 보호법」 제17조·제18조가 허용하는 경우는 예외로 합니다.
          </p>
        </Section>

        <Section id="outsourcing">
          <p>서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁합니다.</p>
          <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {OUTSOURCING.map(({ name, tasks }) => (
              <div key={name} className="p-4">
                <dt className="text-[13px] font-medium text-gray-500">수탁자</dt>
                <dd className="mt-0.5 font-semibold">{name}</dd>
                <dt className="mt-2 text-[13px] font-medium text-gray-500">위탁 업무</dt>
                <dd className="mt-0.5">{tasks}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="overseas">
          <p>
            서비스는 서비스 제공을 위한 처리위탁·보관을 위해 다음과 같이 개인정보를 국외로 이전합니다(「개인정보
            보호법」 제28조의8 제1항 제3호).
          </p>
          <div className="space-y-3">
            <InfoCard
              title="Google LLC"
              rows={[
                {
                  label: "이전 국가",
                  value: `미국 등 Google 데이터센터 소재 국가 (Firestore 데이터 저장 위치: ${legalValue(firestoreRegion)})`,
                },
                { label: "이전 항목", value: "2. 처리하는 개인정보 항목에 적힌 회원·서비스 이용 정보" },
                { label: "이전 시기·방법", value: OVERSEAS_COMMON.when },
                { label: "이전 목적", value: OVERSEAS_COMMON.purpose },
                { label: "보유·이용 기간", value: OVERSEAS_COMMON.period },
                { label: "연락처", value: legalValue(googlePrivacyContact) },
              ]}
            />
            <InfoCard
              title="Vercel Inc."
              rows={[
                { label: "이전 국가", value: `미국 (서버 실행 리전: ${legalValue(vercelRegion)})` },
                { label: "이전 항목", value: "접속 기록, 서비스 이용 중 요청 데이터" },
                { label: "이전 시기·방법", value: OVERSEAS_COMMON.when },
                { label: "이전 목적", value: OVERSEAS_COMMON.purpose },
                { label: "보유·이용 기간", value: OVERSEAS_COMMON.period },
                { label: "연락처", value: legalValue(vercelPrivacyContact) },
              ]}
            />
          </div>
          <p>
            국외 이전을 거부하려면 회원 탈퇴로 개인정보 처리를 중단할 수 있습니다. 이 경우 서비스를 이용할 수
            없습니다.
          </p>
        </Section>

        <Section id="destruction">
          <p>
            보유 기간이 끝나거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일 형태의 정보는 복구할
            수 없는 방법으로 삭제합니다.
          </p>
          <p>관계 법령에 따라 보존해야 하는 경우에는 해당 개인정보를 별도로 분리하여 보관합니다.</p>
        </Section>

        <Section id="children">
          <p>서비스는 만 14세 미만 아동의 회원 가입을 받지 않습니다.</p>
        </Section>

        <Section id="rights">
          <p>
            이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다.
          </p>
          <Bullets
            items={[
              "닉네임 변경: 마이페이지 > 프로필 수정",
              "탈퇴: 마이페이지 > 회원 탈퇴",
              "그 밖의 요청: 아래 개인정보 보호책임자 연락처",
            ]}
          />
          <p>
            요청을 받으면 지체 없이 조치합니다. 이용자의 권리는 대리인을 통해서도 행사할 수 있습니다.
          </p>
        </Section>

        <Section id="security">
          <p>서비스는 개인정보를 안전하게 처리하기 위해 다음 조치를 취하고 있습니다.</p>
          <Bullets
            items={[
              "비밀번호 암호화: 인증 서비스가 해시하여 저장합니다.",
              "전송 구간 암호화: HTTPS로 통신합니다.",
              "접근 권한 제한: 데이터베이스 보안 규칙으로 접근 권한을 제한합니다.",
              "관리자 인증 정보에 대한 접근을 통제합니다.",
            ]}
          />
        </Section>

        <Section id="auto-collect">
          <p>
            서비스는 자체적으로 쿠키를 사용하지 않습니다. 다만 지도 표시와 장소 검색을 위해 불러오는 카카오 지도
            서비스가 자체 정책에 따라 쿠키를 사용할 수 있습니다.
          </p>
          <p>
            다만 브라우저 저장소에 로그인 상태 유지 정보, 푸시 알림 토큰, 로그인 후 이동할 페이지 주소를 저장합니다.
            이 정보는 브라우저 설정에서 사이트 데이터를 삭제하면 지워지며, 이 경우 다시 로그인해야 합니다.
          </p>
          <p>광고·분석용 추적 도구는 사용하지 않습니다.</p>
        </Section>

        <Section id="marketing">
          <p>
            서비스는 광고성 정보를 보내지 않습니다. 채팅, 신청 결과, 모집 마감 등 서비스 알림만 보냅니다.
          </p>
        </Section>

        <Section id="officer">
          <p>
            개인정보 처리에 관한 문의, 불만 처리, 피해 구제 등은 아래 개인정보 보호책임자에게 요청할 수 있습니다.
          </p>
          <dl className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div>
              <dt className="text-[13px] font-medium text-gray-500">성명</dt>
              <dd className="mt-0.5">{privacyOfficer}</dd>
            </div>
            <div>
              <dt className="text-[13px] font-medium text-gray-500">연락처</dt>
              <dd className="mt-0.5">
                {contactEmail?.trim() ? (
                  <a href={`mailto:${contactEmail.trim()}`} className={`break-all ${linkClass}`}>
                    {contactEmail.trim()}
                  </a>
                ) : (
                  legalValue(contactEmail)
                )}
              </dd>
            </div>
          </dl>
        </Section>

        <Section id="remedy">
          <p>
            개인정보 침해로 인한 구제를 받기 위해 아래 기관에 분쟁 해결이나 상담을 신청할 수 있습니다.
          </p>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {REMEDY.map(({ name, phone, site }) => (
              <li key={name} className="p-4">
                <p className="font-semibold">{name}</p>
                <p className="mt-0.5 text-gray-600">{phone}</p>
                <a
                  href={`https://${site}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-0.5 inline-block break-all text-[13px] ${linkClass}`}
                >
                  {site}
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="changes">
          <p>시행일: {legalValue(privacyEffectiveDate)}</p>
          <p>내용이 바뀌면 시행 전에 서비스 안에 공지합니다.</p>
        </Section>
      </main>
    </div>
  );
}
