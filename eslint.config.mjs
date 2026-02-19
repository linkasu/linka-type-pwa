// @ts-check
import localRules from './eslint-local-rules.js'

export default [
  {
    plugins: {
      'local-rules': localRules,
    },
    rules: {
      'local-rules/max-file-lines': ['error', { max: 200 }],
    },
    ignores: [
      'node_modules/**',
      '.output/**',
      '.nuxt/**',
      'dist/**',
    ],
  },
]
