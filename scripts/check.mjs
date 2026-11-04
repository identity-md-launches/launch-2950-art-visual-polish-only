import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { Script } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const dir of ['', 'dist']) {
  const html = await readFile(join(root, dir, 'index.html'), 'utf8');
  new Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
  assert.match(html, /<title>Wheelbound<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.match(html, /<meta property="og:title" content="Wheelbound"/);
  assert.match(html, /<meta property="og:image" content="https:\/\/wheelbound.imd.site\/og.png"/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/wheelbound.imd.site\/og.png"/);
  assert.doesNotMatch(html, /<script[^>]*\bsrc=/);
  assert.doesNotMatch(html, /Math\.random\s*\(/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, 'Element IDs must be unique');
  assert.match(html, /trailArt\.complete && trailArt\.naturalWidth > 0/);
  for (const [name, width, height] of [['og.png', 1200, 630], ['card.png', 1600, 900]]) {
    const b = await readFile(join(root, dir, name));
    assert.equal(b.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(b.readUInt32BE(16), width);
    assert.equal(b.readUInt32BE(20), height);
  }
  const assets = [...html.matchAll(/(?:src=|href=)["']([^"']+)["']/g)].map(m => m[1]);
  for (const url of assets.filter(u => !u.includes(':') && !u.startsWith('#'))) {
    assert(!url.startsWith('/'), 'Runtime assets must be relative');
    await stat(join(root, dir, url));
  }
  for (const m of html.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
    assert(!m[1].startsWith('/'), 'CSS assets must be relative');
    await stat(join(root, dir, m[1]));
  }
  console.log(`${dir || 'Source'}: JavaScript syntax, metadata, IDs, relative assets, deterministic art, image guards, PNG dimensions passed.`);
}
for (const name of ['index.html', 'favicon.svg', 'og.png', 'card.png']) {
  assert.deepEqual(await readFile(join(root, name)), await readFile(join(root, 'dist', name)), `Export drift: ${name}`);
}
console.log('Source and production documents / share assets match byte for byte.');
