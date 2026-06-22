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
      // Gate the genuinely unit-tested core. image.js is canvas/DOM code jsdom can't
      // execute (~17% reachable), so it's excluded from the gate rather than dragging
      // the aggregate down with noise. Expand `include` as real suites are added.
      include: ['src/lib/util.js', 'src/components/ErrorBoundary.jsx'],
      thresholds: { lines: 70, functions: 50, statements: 70, branches: 60 },
    },
  },
})
