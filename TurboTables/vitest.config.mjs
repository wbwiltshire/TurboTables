import { defineConfig } from 'vitest/config';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// On Windows a lowercase drive letter in the working directory (VS Code often opens
// "c:\...") makes Vitest load two copies of itself. Use the canonical path as root.
const root = realpathSync.native(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
     root,
     test: {
          include: ['tests/**/*.test.{js,mjs}'],
          environment: 'node'   // library tests opt into jsdom with a @vitest-environment comment
     }
});
