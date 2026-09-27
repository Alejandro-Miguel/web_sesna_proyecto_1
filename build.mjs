// Compilación de producción → dist/
//   node build.mjs
// Requiere Node 18+. Usa esbuild vía npx (solo en desarrollo; el sitio no tiene dependencias).
//  1. CSS: une tokens.css + app.css, minifica y copia las fuentes con hash.
//  2. JS: minifica data.js y app.js (se mantienen separados: data.js lo sustituirá el CMS).
//  3. HTML: reescribe rutas a los archivos con hash y quita comentarios/espacios.
//  4. Precomprime todo en .br y .gz para servirlos estáticos (ver servidor/).
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

const OUT = 'dist';
const ESBUILD = ['--yes', 'esbuild@0.24.2'];
rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/assets`, { recursive: true });

function esbuild(args) {
  execFileSync('npx', [...ESBUILD, ...args], { stdio: ['ignore', 'ignore', 'inherit'] });
}
function outputs(metaFile) {
  const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
  rmSync(metaFile);
  return Object.entries(meta.outputs).map(([file, o]) => ({ file: relative(OUT, file), entry: o.entryPoint }));
}

// 1. CSS (el @import se resuelve en compilación: una sola petición)
writeFileSync('css/.bundle.css', '@import "./tokens.css";\n@import "./app.css";\n');
esbuild(['css/.bundle.css', '--bundle', '--minify', '--loader:.woff2=file',
  '--entry-names=styles-[hash]', '--asset-names=[name]-[hash]',
  `--outdir=${OUT}/assets`, `--metafile=${OUT}/css.json`]);
rmSync('css/.bundle.css');
const css = outputs(`${OUT}/css.json`);
const cssFile = css.find(o => o.file.endsWith('.css')).file;
const fonts = css.filter(o => o.file.endsWith('.woff2')).map(o => o.file);

// 2. JS
esbuild(['js/data.js', 'js/app.js', '--minify', '--target=es2017',
  '--entry-names=[name]-[hash]', `--outdir=${OUT}/assets`, `--metafile=${OUT}/js.json`]);
const js = outputs(`${OUT}/js.json`);
const jsFor = name => js.find(o => o.entry === `js/${name}`).file;

// 3. HTML
let html = readFileSync('index.html', 'utf8');
const swap = (from, to) => {
  if (!html.includes(from)) throw new Error(`No se encontró en index.html: ${from}`);
  html = html.replace(from, to);
};
swap('<link rel="stylesheet" href="css/tokens.css">\n<link rel="stylesheet" href="css/app.css">',
     `<link rel="stylesheet" href="${cssFile}">`);
swap('src="js/data.js"', `src="${jsFor('data.js')}"`);
swap('src="js/app.js"', `src="${jsFor('app.js')}"`);
for (const f of fonts) {
  const base = f.replace(/^assets\//, '').replace(/-[A-Z0-9]+\.woff2$/, '.woff2');
  swap(`href="fonts/${base}"`, `href="${f}"`);
}
html = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/>\s+</g, '><')
  .replace(/\n{2,}/g, '\n')
  .trim();
writeFileSync(`${OUT}/index.html`, html + '\n');

// 4. Precompresión
const walk = d => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
let total = 0, totalBr = 0;
for (const file of walk(OUT)) {
  if (!/\.(html|css|js|svg)$/.test(file)) continue;
  const buf = readFileSync(file);
  const br = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
  writeFileSync(`${file}.br`, br);
  writeFileSync(`${file}.gz`, gzipSync(buf, { level: 9 }));
  total += buf.length; totalBr += br.length;
  console.log(`${relative(OUT, file).padEnd(34)} ${String(buf.length).padStart(7)} B  → br ${String(br.length).padStart(6)} B`);
}
console.log(`Texto total: ${(total / 1024).toFixed(1)} KB → ${(totalBr / 1024).toFixed(1)} KB con brotli`);
fonts.forEach(f => console.log(`${f.padEnd(34)} ${String(statSync(join(OUT, f)).size).padStart(7)} B  (woff2 ya comprimido)`));
