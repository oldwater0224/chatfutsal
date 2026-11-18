import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import SubHeader from "@/src/components/SubHeader";
import { focusRingClass } from "@/src/components/ui/styles";
import { LEGAL_INFO, legalValue } from "@/src/lib/legal/legalInfo";

export const metadata: Metadata = {
  title: "이용약관",
};

// 정해지지 않은 값은 legalValue로 감싸 "(추후 기재)"로 보이게 한다. 이 파일에 직접 적지 않는다

const ARTICLES = [
  { id: "purpose", title: "목적" },
  { id: "definitions", title: "정의" },
  { id: "notice", title: "약관의 게시와 변경" },
  { id: "signup", title: "회원 가입" },
  { id: "account", title: "계정 관리" },
  { id: "service", title: "서비스의 내용" },
  { id: "obligations", title: "이용자의 의무" },
  { id: "posts", title: "게시물" },
  { id: "restriction", title: "이용 제한" },
  { id: "withdrawal", title: "탈퇴" },
  { id: "liability", title: "책임의 한계" },
  { id: "disputes", title: "분쟁 해결" },
] as const;

type ArticleId = (typeof ARTICLES)[number]["id"];

const bodyClass = "text-[15px] leading-relaxed text-gray-900";
const linkClass = `text-green-700 underline underline-offset-2 rounded-sm ${focusRingClass}`;

function Article({ id, children }: { id: ArticleId; children: ReactNode }) {
  const index = ARTICLES.findIndex((a) => a.id === id);
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 pt-8">
      <h2 id={`${id}-title`} className="text-[17px] font-semibold text-gray-900">
        제{index + 1}조 ({ARTICLES[index].title})
      </h2>
      <div className={`mt-3 space-y-3 ${bodyClass}`}>{children}</div>
    </section>
  );
}

function Numbered({ items }: { items: ReactNode[] }) {
  return (
    <ol className="list-decimal pl-5 space-y-1.5 marker:text-gray-500">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

export default function TermsPage() {
  const { serviceName, operatorName, contactEmail, termsEffectiveDate } = LEGAL_INFO;

  return (
    <div className="min-h-screen bg-white">
      <SubHeader title="이용약관" backHref="/" />

      <main className="pt-14 pb-12 max-w-2xl mx-auto px-4 break-keep wrap-break-word">
        <nav aria-labelledby="toc-title" className="mt-6 rounded-xl bg-gray-50 p-4">
          <h2 id="toc-title" className="text-[13px] font-medium text-gray-500">
            목차
          </h2>
          <ol className="mt-2 space-y-1.5 text-[13px]">
            {ARTICLES.map(({ id, title }, i) => (
              <li key={id}>
                <a href={`#${id}`} className={`text-gray-600 hover:text-gray-900 hover:underline rounded-sm ${focusRingClass}`}>
                  제{i + 1}조 {title}
                </a>
              </li>
            ))}
            <li>
              <a href="#addendum" className={`text-gray-600 hover:text-gray-900 hover:underline rounded-sm ${focusRingClass}`}>
                부칙
              </a>
            </li>
          </ol>
        </nav>

        <Article id="purpose">
          <p>
            이 약관은 {serviceName}(이하 &lsquo;서비스&rsquo;)의 이용 조건과 절차, 운영자와 이용자의 권리·의무를
            정하는 것을 목적으로 합니다.
          </p>
        </Article>

        <Article id="definitions">
          <Numbered
            items={[
              `‘서비스’란 운영자가 제공하는 ${serviceName} 웹 서비스를 말합니다.`,
              "‘이용자(회원)’란 이 약관에 동의하고 가입하여 서비스를 이용하는 사람을 말합니다.",
              "‘게시물’이란 이용자가 서비스에 올린 모집글, 참가 신청 메시지, 채팅 메시지 등을 말합니다.",
            ]}
          />
        </Article>

        <Article id="notice">
          <Numbered
            items={[
              "운영자는 이 약관을 서비스 안에 게시합니다.",
              "운영자는 관계 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.",
              "약관을 변경할 때는 시행일 7일 전까지 공지합니다. 이용자에게 불리하게 변경하는 경우에는 시행일 30일 전까지 공지합니다.",
              "이용자는 변경된 약관에 동의하지 않으면 탈퇴할 수 있습니다.",
            ]}
          />
        </Article>

        <Article id="signup">
          <Numbered
            items={[
              "회원 가입은 만 14세 이상만 할 수 있습니다.",
              "이용 계약은 이용자가 이 약관에 동의하고 가입 절차를 마치면 성립합니다.",
              "타인의 정보를 도용하거나 허위 정보로 가입한 경우 서비스 이용이 제한될 수 있습니다.",
            ]}
          />
        </Article>

        <Article id="account">
          <Numbered
            items={[
              "계정과 비밀번호를 관리할 책임은 회원에게 있습니다.",
              "회원은 계정이 도용된 사실을 알게 되면 즉시 운영자에게 알려야 합니다.",
            ]}
          />
        </Article>

        <Article id="service">
          <Numbered
            items={[
              "서비스는 풋살 모집글 작성·조회, 참가 신청·수락, 이용자 간 채팅, 알림 기능을 제공합니다.",
              "서비스는 무료로 제공됩니다.",
              "운영자는 운영상·기술상 필요한 경우 서비스를 변경하거나 중단할 수 있으며, 중요한 변경은 미리 공지합니다.",
            ]}
          />
        </Article>

        <Article id="obligations">
          <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-gray-400">
            <li>타인의 정보 도용</li>
            <li>다른 이용자의 개인정보를 무단으로 수집하거나 게시하는 행위</li>
            <li>욕설, 혐오 표현, 괴롭힘</li>
            <li>허위 모집글 작성이나 반복적인 노쇼</li>
            <li>영리 목적의 광고, 스팸</li>
            <li>서비스 운영을 방해하는 행위</li>
            <li>그 밖에 법령을 위반하는 행위</li>
          </ul>
        </Article>

        <Article id="posts">
          <Numbered
            items={[
              "게시물에 대한 권리와 책임은 작성자에게 있습니다.",
              "운영자는 법령이나 이 약관을 위반한 게시물을 삭제하거나 비공개로 전환할 수 있습니다.",
            ]}
          />
        </Article>

        <Article id="restriction">
          <p>
            운영자는 이용자가 제7조를 위반한 경우 경고, 일시 정지, 이용 제한 등의 조치를 할 수 있습니다.
          </p>
        </Article>

        <Article id="withdrawal">
          <Numbered
            items={[
              "회원은 언제든지 마이페이지에서 탈퇴할 수 있습니다.",
              <>
                탈퇴하면 개인정보는{" "}
                <Link href="/privacy" className={`font-semibold ${linkClass}`}>
                  개인정보 처리방침
                </Link>
                에 따라 파기합니다.
              </>,
              "다른 이용자와 주고받은 채팅 메시지 내용은 상대방의 대화 기록으로 남으며, 작성자 이름은 ‘탈퇴한 사용자’로 표시됩니다.",
            ]}
          />
        </Article>

        <Article id="liability">
          <Numbered
            items={[
              "서비스는 이용자 간 경기 모집을 중개하는 공간을 제공합니다.",
              "경기 참여 중 발생한 부상, 이용자 간 분쟁, 구장 이용과 관련된 문제는 당사자 사이에서 해결해야 하며, 운영자는 고의 또는 중대한 과실이 없는 한 책임지지 않습니다.",
              "천재지변 등 불가항력으로 서비스를 제공할 수 없는 경우에도 같습니다.",
            ]}
          />
        </Article>

        <Article id="disputes">
          <p>
            이 약관은 대한민국 법을 따르며, 서비스 이용과 관련한 분쟁은 「민사소송법」상 관할 법원에서 해결합니다.
          </p>
        </Article>

        <section id="addendum" aria-labelledby="addendum-title" className="scroll-mt-16 pt-8">
          <h2 id="addendum-title" className="text-[17px] font-semibold text-gray-900">
            부칙
          </h2>
          <p className={`mt-3 ${bodyClass}`}>시행일: {legalValue(termsEffectiveDate)}</p>
        </section>

        <dl className="mt-10 rounded-xl bg-gray-50 p-4 space-y-2 text-[13px]">
          <div className="flex gap-2">
            <dt className="shrink-0 text-gray-500">운영자</dt>
            <dd className="min-w-0 text-gray-900">{operatorName}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-gray-500">문의</dt>
            <dd className="min-w-0 text-gray-900">
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
      </main>
    </div>
  );
}
