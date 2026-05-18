import globals from 'globals'
import tseslint from 'typescript-eslint'
import js from '@eslint/js'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs', 'rollup.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
      'preserve-caught-error': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'lib/', '*.mjs', 'src/template/'],
  },
]
