/* eslint-env node */

import { chrome } from '../../.electron-vendors.cache.json';
import { join } from 'path';
import vue from '@vitejs/plugin-vue';
import { renderer } from 'unplugin-auto-expose';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import { defineConfig } from 'vite';

const PACKAGE_ROOT = __dirname;

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = defineConfig({
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
    },
  },
  base: '',
  server: {
    fs: {
      strict: true,
    },
  },
  build: {
    sourcemap: true,
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    rollupOptions: {
      input: join(PACKAGE_ROOT, 'index.html'),
    },
    emptyOutDir: true,
    // brotliSize: false,
  },
  test: {
    environment: 'happy-dom',
  },
  plugins: [
    vue(),
    Components({
      dts: true,
      resolvers: [AntDesignVueResolver({ importStyle: 'css' })],
    }),
    renderer.vite({
      preloadEntry: join(PACKAGE_ROOT, '../preload/src/index.ts'),
    }),
  ],
});

export default config;
