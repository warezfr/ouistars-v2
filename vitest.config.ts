import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: [
      // Alias projet « @/ » → src/
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
      // Les modules serveur importent leurs voisins en `.js` (NodeNext) :
      // on redirige `./x.js` relatif vers `./x` pour que Vite résolve le `.ts`.
      { find: /^(\.{1,2}\/.*)\.js$/, replacement: '$1' },
    ],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'server/**', 'api/**', 'src/data/pricing.ts'],
      reporter: ['text', 'html'],
    },
  },
});
