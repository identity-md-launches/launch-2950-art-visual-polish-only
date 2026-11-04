// Optional packaging only: the site itself runs directly from index.html.
import { cp, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'favicon.svg', 'og.png', 'card.png', 'art']) {
  await cp(join(root, name), join(out, name), { recursive: true });
}
const html = await readFile(join(out, 'index.html'), 'utf8');
if (!html.includes('<title>Wheelbound</title>')) throw new Error('Missing game document');
console.log('Production export: dist/index.html, favicon.svg, og.png, card.png, art/');
console.log('No compilation, dependencies, bundler, or network required.');
