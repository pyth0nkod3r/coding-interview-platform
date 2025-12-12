import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests_integration/**/*.test.ts'],
        globals: true,
        setupFiles: ['tests_integration/setup.ts'],
        env: {
            DATABASE_URL: "file:/workspaces/coding-interview-platform/backend/test.db"
        },
        fileParallelism: false,
    },
});
