import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import { terser } from 'rollup-plugin-terser'
import { resolve } from 'path'

const root = resolve(__dirname, 'src')
const outDir = resolve(__dirname, '../docs/004')

const viteConfig = defineConfig({
  root,
  base: process.env.NODE_ENV === 'production' ? '/study-webgl-school/004/' : '/',
  plugins: [
    glsl(),
  ],
  resolve: {
    alias: {
      '@/': `${__dirname}/src/`,
    },
  },
  server: {
    host: true,
  },
  build: {
    outDir,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      plugins: [terser()],
    },
  },
})

export default viteConfig
