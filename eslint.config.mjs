import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

const config = [
  { ignores: ['.next', 'node_modules', 'next-env.d.ts'] },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
  eslintPluginPrettier,
]

export default config
