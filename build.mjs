// Bundles each page's script and inlines it into its template, producing self-contained index.html and pay.html.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const pages = [
  { entry: 'src/main.js', template: 'src/template.html', out: 'index.html' },
  { entry: 'src/pay.js', template: 'src/pay-template.html', out: 'pay.html' },
];
for (const page of pages) {
  const result = await build({
    entryPoints: [page.entry],
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
  const html = readFileSync(page.template, 'utf8').replace('/*BUNDLE*/', () => js);
  writeFileSync(page.out, html);
  console.log(`${page.out} written (${(html.length / 1024).toFixed(0)} KB)`);
}
