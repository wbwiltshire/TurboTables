// Fails when dist/ is stale, so a release tag never ships old files. Fix with: npm run build
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { buildOutputs, distDir } from '../scripts/build.mjs';

describe('dist', () => {
     it('matches a fresh build', async () => {
          const outputs = await buildOutputs();
          for (const [name, expected] of Object.entries(outputs)) {
               const file = path.join(distDir, name);
               expect(existsSync(file), 'missing dist/' + name).toBe(true);
               expect(readFileSync(file, 'utf8').replace(/\r\n/g, '\n'), 'dist/' + name + ' is stale').toBe(expected.replace(/\r\n/g, '\n'));
          }
     });

     it('keeps the license banner in the minified file', async () => {
          const outputs = await buildOutputs();
          expect(outputs['turbotables.min.js']).toContain('TurboTables v');
          expect(outputs['turbotables.min.js']).toContain('sourceMappingURL=turbotables.min.js.map');
     });
});
