import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Cloud Functions are CommonJS + linted in their own setup; rules test needs the emulator.
  globalIgnores(['dist', 'functions', 'test/rules.test.js']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Co-locating a Context provider with its hook is intentional here.
      'react-refresh/only-export-components': 'off',
      // Resetting state inside subscription-cleanup effects is correct for our listeners.
      'react-hooks/set-state-in-effect': 'off',
      // Surface unused vars as warnings, don't fail the build on leftovers.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
])
