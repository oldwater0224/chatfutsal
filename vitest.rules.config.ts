import { defineConfig } from 'vitest/config';

// Firestore 보안 규칙 테스트 (에뮬레이터 필요: npm run test:rules)
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
