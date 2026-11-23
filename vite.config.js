import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
  ],
  // Pre-bundle every Vuetify overlay together. Otherwise the dev server can
  // serve two copies of Vuetify's overlay stack, and a select's menu opens
  // behind the dialog it's in. Builds aren't affected
  optimizeDeps: {
    include: [
      'vuetify/components/VOverlay',
      'vuetify/components/VDialog',
      'vuetify/components/VMenu',
      'vuetify/components/VSelect',
      'vuetify/components/VAutocomplete',
      'vuetify/components/VTooltip',
    ],
  },
  define: { 'process.env': {} },
  base: '/apps/vigilant-harvest/',
  server: {
    watch: {
      // Playwright writes these while the UI suite runs; watching them could
      // reload the pages under test
      ignored: ['**/test-results/**', '**/playwright-report/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
