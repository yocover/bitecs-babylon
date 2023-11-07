import { defineConfig } from 'vite';
import commonjs from '@rollup/plugin-commonjs';
import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'dt-engine',
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        '@babylonjs/core',
        '@babylonjs/gui',
        '@babylonjs/inspector',
        '@babylonjs/gui-editor',
        '@babylonjs/loaders',
        '@babylonjs/materials',
        '@babylonjs/serializers',
        'axios',
        'platform',
        '@tweenjs/tween.js'
      ]
    },
    outDir: resolve(__dirname, 'dist')
  },
  plugins: [
    commonjs(),
    visualizer({
      filename: 'stats.html',
      emitFile: true
    }),
    dts({
      outDir: './dist',
      include: ['./src']
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
