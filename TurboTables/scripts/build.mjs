// Builds the distributable TurboTables files into <repo>/dist:
//   turbotables.js, turbotables.min.js (+ .map), turbotables.css, turbotables.min.css
// Usage: npm run build
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const distDir = path.resolve(projectDir, '..', 'dist');
const jsSource = path.join(projectDir, 'public', 'javascripts', 'turbotables.js');
const cssSource = path.join(projectDir, 'public', 'stylesheets', 'turbotables.css');

function read(file) {
     return readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

// Returns { fileName: contents } for everything in dist, without writing anything.
export async function buildOutputs() {
     const { version } = JSON.parse(read(path.join(projectDir, 'package.json')));
     const js = read(jsSource);
     const css = read(cssSource);

     const problems = [];
     if (!js.includes(' * TurboTables v' + version + '\n')) problems.push('turbotables.js banner');
     if (!js.includes("var VERSION = '" + version + "';")) problems.push('turbotables.js VERSION constant');
     if (!css.startsWith('/*! TurboTables v' + version + ' ')) problems.push('turbotables.css banner');
     if (problems.length)
          throw new Error('Version ' + version + ' from package.json is not in: ' + problems.join(', '));

     const common = { write: false, minify: true, legalComments: 'inline', target: 'es2017', logLevel: 'silent' };
     const [minJs, minCss] = await Promise.all([
          esbuild.build({ ...common, entryPoints: [jsSource], outfile: path.join(distDir, 'turbotables.min.js'), sourcemap: 'linked', sourcesContent: true }),
          esbuild.build({ ...common, entryPoints: [cssSource], outfile: path.join(distDir, 'turbotables.min.css') })
     ]);

     const outputs = { 'turbotables.js': js, 'turbotables.css': css };
     for (const file of [...minJs.outputFiles, ...minCss.outputFiles]) {
          let text = file.text;
          // Keep the source map's path stable regardless of where the repo is checked out.
          if (file.path.endsWith('.map')) {
               const map = JSON.parse(text);
               map.sources = ['turbotables.js'];
               text = JSON.stringify(map);
          }
          outputs[path.basename(file.path)] = text;
     }
     return outputs;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
     const outputs = await buildOutputs();
     mkdirSync(distDir, { recursive: true });
     for (const [name, text] of Object.entries(outputs)) {
          writeFileSync(path.join(distDir, name), text);
          console.log('  dist/' + name.padEnd(24) + (Buffer.byteLength(text) / 1024).toFixed(1) + ' KB');
     }
}
