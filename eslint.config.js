import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jestPlugin from 'eslint-plugin-jest';
import jsdocPlugin from 'eslint-plugin-jsdoc';

export default [
  // Base JavaScript recommendations
  js.configs.recommended,
  
  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'jsdoc': jsdocPlugin,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-var-requires': 'error',
      
      // General code quality rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // JSDoc rules (basic ones)
      'jsdoc/check-alignment': 'warn',
      'jsdoc/check-param-names': 'warn',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
    },
  },
  
  // Test files configuration
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...jestPlugin.environments.globals.globals,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'jest': jestPlugin,
    },
    rules: {
      // Jest specific rules
      ...jestPlugin.configs.recommended.rules,
      'jest/expect-expect': 'error',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
      
      // Relaxed rules for tests
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.js',
      '*.mjs',
      '*.cjs',
    ],
  },
];
