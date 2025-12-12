import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        exclude: [
            'node_modules/**',
            'src/tests/e2e.spec.ts' // Playwright e2e tests are run separately
        ],
    },
})
