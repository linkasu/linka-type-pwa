// @ts-check
import withNuxt from './node_modules/.cache/nuxt/.nuxt/eslint.config.mjs'
import localRules from './eslint-local-rules.js'

export default withNuxt(
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
  }
)
