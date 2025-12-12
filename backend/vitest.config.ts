import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        globals: true,
        fileParallelism: false, // Run test files sequentially to avoid DB race conditions
    },
});
