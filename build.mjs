// Bundles src/main.js and inlines it into src/template.html, producing a single self-contained index.html.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const result = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2020',
  write: false,
  loader: { '.svg': 'text' },
  define: { global: 'globalThis', 'process.env.NODE_ENV': '"production"' },
  logLevel: 'warning',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = readFileSync('src/template.html', 'utf8').replace('/*BUNDLE*/', () => js);
writeFileSync('index.html', html);
console.log(`index.html written (${(html.length / 1024).toFixed(0)} KB)`);
