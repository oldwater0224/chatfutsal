import { defineConfig } from 'vitest/config';

// Firestore 에뮬레이터가 필요한 테스트: 보안 규칙, 서버 정리 작업 (npm run test:rules)
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts', 'tests/server/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
