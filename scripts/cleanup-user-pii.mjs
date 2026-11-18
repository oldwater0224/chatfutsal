// 1회용: 운영 users 문서에서 더 이상 저장하지 않는 개인정보 필드(email, profileImage)를 지운다.
//
// 기본은 dry-run(대상 문서 수만 출력). --apply를 붙였을 때만 실제로 지운다.
// 이메일 등 필드 값은 출력하지 않는다.
//
//   node --env-file=.env.local scripts/cleanup-user-pii.mjs           # dry-run
//   node --env-file=.env.local scripts/cleanup-user-pii.mjs --apply   # 실제 삭제
//
// 필요한 환경 변수 (서버와 같음, src/lib/server/googleAuth.ts):
//   FIREBASE_PROJECT_ID 또는 NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
// FIRESTORE_EMULATOR_HOST가 있으면 에뮬레이터에 실행한다.
//
// 서비스 계정 요청은 보안 규칙을 거치지 않는다. 쓰기는 updateMask로 두 필드만 지우고,
// 문서가 그 사이 삭제됐으면(currentDocument.exists) 다시 만들지 않는다.
import jwt from "jsonwebtoken";

const FIELDS = ["email", "profileImage"];
const PAGE_SIZE = 300;
const COMMIT_LIMIT = 500;

const apply = process.argv.includes("--apply");

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Firebase 프로젝트 ID 환경 변수가 없습니다");
  process.exit(1);
}

const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const baseUrl = emulator ? `http://${emulator}/v1` : "https://firestore.googleapis.com/v1";
const database = `projects/${projectId}/databases/(default)`;

async function accessToken() {
  if (emulator) return "owner";
  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) throw new Error("Firebase 서비스 계정 환경 변수가 없습니다");

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: email,
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    privateKey,
    { algorithm: "RS256" },
  );
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`액세스 토큰 발급 실패: ${res.status}`);
  return (await res.json()).access_token;
}

async function request(token, path, body) {
  const res = await fetch(`${baseUrl}/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // 응답 본문에 문서 내용이 섞일 수 있어 상태 코드만 출력한다
  if (!res.ok) throw new Error(`Firestore 요청 실패 (${path.split("?")[0]}): ${res.status}`);
  return res.json();
}

// users 문서를 페이지 단위로 훑으며 대상 필드가 있는 문서 이름만 모은다 (값은 받지만 보관·출력하지 않는다)
async function findTargets(token) {
  const targets = [];
  let scanned = 0;
  let pageToken = "";
  do {
    const params = new URLSearchParams({ pageSize: String(PAGE_SIZE) });
    for (const field of FIELDS) params.append("mask.fieldPaths", field);
    if (pageToken) params.set("pageToken", pageToken);

    const page = await request(token, `${database}/documents/users?${params}`);
    for (const document of page.documents ?? []) {
      scanned++;
      const present = FIELDS.filter((field) => document.fields && field in document.fields);
      if (present.length > 0) targets.push({ name: document.name, present });
    }
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);
  return { scanned, targets };
}

async function main() {
  const token = await accessToken();
  const { scanned, targets } = await findTargets(token);

  const counts = Object.fromEntries(
    FIELDS.map((field) => [field, targets.filter((t) => t.present.includes(field)).length]),
  );
  console.log(`대상 프로젝트: ${emulator ? "에뮬레이터" : projectId}`);
  console.log(`users 문서 ${scanned}개 확인, 정리 대상 ${targets.length}개`);
  for (const field of FIELDS) console.log(`  ${field} 필드가 있는 문서: ${counts[field]}개`);

  if (!apply) {
    console.log("dry-run이라 지우지 않았습니다. 실제로 지우려면 --apply를 붙여 다시 실행하세요.");
    return;
  }

  // updateMask에 넣고 fields에 값을 넣지 않으면 그 필드가 삭제된다
  const writes = targets.map((t) => ({
    update: { name: t.name, fields: {} },
    updateMask: { fieldPaths: FIELDS },
    currentDocument: { exists: true },
  }));

  let done = 0;
  for (let i = 0; i < writes.length; i += COMMIT_LIMIT) {
    const chunk = writes.slice(i, i + COMMIT_LIMIT);
    await request(token, `${database}/documents:commit`, { writes: chunk });
    done += chunk.length;
    console.log(`  ${done}/${writes.length} 처리`);
  }
  console.log(`완료: users 문서 ${done}개에서 ${FIELDS.join(", ")} 필드를 지웠습니다.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "정리 실패");
  process.exit(1);
});
