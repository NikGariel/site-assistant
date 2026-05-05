import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    noExternal: ['site-assistant-shared'],
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'SiteAssistantSDK',
    outExtension: () => ({ js: '.umd.js' }),
    sourcemap: true,
    minify: true,
    noExternal: ['site-assistant-shared'],
  },
])
