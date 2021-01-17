module.exports = {
  root: true,
  env: {
    browser: true,
  },
  extends: [
    'plugin:vue/recommended',
    '@vue/standard',
    '@vue/typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  globals: {
    name: 'off',
  },
  rules: {
    'vue/html-closing-bracket-newline': [
      'error',
      {
        singleline: 'never',
        multiline: 'always',
      },
    ],
    'no-var': ['error'],
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'none',
        },
        singleline: {
          delimiter: 'comma',
        },
      },
    ],
    '@typescript-eslint/ban-ts-ignore': 'warn',
    '@typescript-eslint/no-use-before-define': 'off',
    'comma-dangle': ['error', 'always-multiline'],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'generated/',
    '!.*',
  ],
}
