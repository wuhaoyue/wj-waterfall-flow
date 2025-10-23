import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WaterfallFlow',
      formats: ['es', 'umd'],
      fileName: (format) => `waterfall-flow.${format === 'es' ? 'js' : 'umd.js'}`
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    },
    sourcemap: true,
    minify: 'esbuild'
  },
  server: {
    open: '/example/index.html'
  }
})

