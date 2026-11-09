// 공용 클래스. 화면마다 값이 흩어지지 않도록 여기서만 정한다.
// 글자 크기: 12(xs) · 13 · 15 · 17 · 22 / 글자색: 900(주) · 600(보조) · 500(흐림, 흰 바탕 약 4.8:1) · 300(비활성·placeholder)
// 모서리: 입력·버튼 rounded-lg, 카드·패널 rounded-xl, 칩·FAB만 rounded-full

/** 키보드 포커스 표시 (버튼·링크·카드) */
export const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/40";

/** 화면 폭을 채우는 목록 행용 포커스 표시 (바깥으로 넘치지 않게 안쪽에 그린다) */
export const focusRingInsetClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600/40";

export const fieldLabelClass = "block text-[13px] font-medium text-gray-900 mb-2";

export const fieldInputClass =
  "w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-green-600 focus-visible:ring-2 focus-visible:ring-green-600/40 transition-colors";

export const fieldTextareaClass =
  "w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-green-600 focus-visible:ring-2 focus-visible:ring-green-600/40 transition-colors resize-none";

/** 회색 바탕 검색 입력 (홈 검색, 채팅 상대 검색, 메시지 입력). 높이·여백은 쓰는 쪽에서 붙인다 */
export const searchInputClass =
  "w-full rounded-lg bg-gray-100 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus-visible:ring-2 focus-visible:ring-green-600/40 transition-colors";

export const spinnerClass =
  "w-7 h-7 border-3 border-gray-100 border-t-green-600 rounded-full animate-spin";

/** 카카오 로그인 진행 중에만 쓰는 노란 스피너 */
export const kakaoSpinnerClass =
  "w-7 h-7 border-3 border-yellow-100 border-t-yellow-400 rounded-full animate-spin";

export const primaryButtonClass =
  `inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:bg-gray-300 cursor-pointer disabled:cursor-default transition-colors ${focusRingClass}`;

export const secondaryButtonClass =
  `inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 cursor-pointer transition-colors ${focusRingClass}`;

/** 테두리 없는 회색 버튼 (더 보기, 필터 초기화, 신청 취소 같은 보조 동작) */
export const quietButtonClass =
  `inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 cursor-pointer disabled:opacity-50 transition-colors ${focusRingClass}`;

/** 아이콘만 있는 40px 원형 버튼의 틀. 색은 쓰는 쪽에서 붙인다 (같은 속성을 두 번 주면 어느 쪽이 이길지 보장되지 않는다) */
export const iconButtonBaseClass =
  `w-10 h-10 shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-colors ${focusRingClass}`;

/** 아이콘만 있는 40px 원형 버튼 (헤더, 메뉴) */
export const iconButtonClass = `${iconButtonBaseClass} text-gray-600 hover:bg-gray-100`;

/** 플로팅 작성 버튼 (모바일 홈) */
export const fabClass =
  `inline-flex items-center justify-center gap-2 h-12 pl-4 pr-5 rounded-full bg-green-600 text-white text-[15px] font-semibold shadow-lg hover:bg-green-700 transition-colors ${focusRingClass}`;

/** 상태·레벨 배지. 색은 쓰는 쪽에서 붙인다 */
export const badgeClass = "inline-flex items-center h-6 px-2 rounded-md text-xs font-medium";

/** 읽지 않은 수 배지 (헤더, 하단 탭) */
export const unreadBadgeClass =
  "min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold leading-none tabular-nums flex items-center justify-center";

/** 이니셜 아바타. 크기·글자 크기는 쓰는 쪽에서 붙인다 */
export const avatarClass =
  "shrink-0 rounded-full bg-gray-100 text-gray-600 font-medium flex items-center justify-center";

/** 빈 화면 아이콘 타일 */
export const emptyIconTileClass =
  "w-12 h-12 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center mb-4";

/** 드롭다운 메뉴 행의 틀. 글자색은 쓰는 쪽에서 붙인다 */
export const menuItemBaseClass =
  "w-full h-10 px-4 flex items-center gap-2 text-left text-[15px] hover:bg-gray-50 cursor-pointer focus-visible:outline-none focus-visible:bg-gray-50";

/** 드롭다운 메뉴 행 */
export const menuItemClass = `${menuItemBaseClass} text-gray-900`;

/** 삭제·나가기처럼 되돌릴 수 없는 메뉴 행 */
export const dangerMenuItemClass = `${menuItemBaseClass} text-red-600`;
