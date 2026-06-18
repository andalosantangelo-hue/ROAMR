/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    exclude: ['node_modules/**', 'dist/**', 'test/rules.test.js'], // rules tests run via test:rules (emulator)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Gate the tested core. Expand `include` as more suites are added.
      include: ['src/lib/util.js', 'src/lib/image.js', 'src/components/ErrorBoundary.jsx'],
      thresholds: { lines: 70, functions: 70, statements: 70, branches: 50 },
    },
  },
})
