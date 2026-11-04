// Optional browser validation. Pass a Playwright module path, or install Playwright
// where Node can import it. All generated files stay in test/scratch/.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, extname, join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist'), scratch = join(root, 'test/scratch/browser-check');
const mime = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain' };
await mkdir(scratch, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://preview.invalid').pathname).replace(/^\/preview\//, '/');
    const file = resolve(out, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(out + '/')) { res.writeHead(403).end(); return; }
    const data = await readFile(file); res.setHeader('content-type', mime[extname(file)] || 'application/octet-stream'); res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}`;
let browser;
const results = [], errors = [], localFailures = [];
const passed = (name, detail = '') => { results.push({ name, passed: true, detail }); console.log('PASS ' + name + (detail ? ': ' + detail : '')); };
try {
  const { chromium } = process.argv[2] ? await import(pathToFileURL(resolve(process.argv[2])).href) : await import('playwright');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  const page = await context.newPage();
  const observe = p => {
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    p.on('response', r => { if (r.url().startsWith(url) && r.status() >= 400) localFailures.push({ url: new URL(r.url()).pathname, status: r.status() }); });
  };
  observe(page);
  let response = await page.goto(url + '/preview/', { waitUntil: 'load' });
  assert.equal(response.status(), 200); assert.equal(await page.title(), 'Wheelbound');
  await page.waitForFunction(() => window.__wb?.S?.ready && !window.__wb.S.histPaging && window.__wb.world.days.length && document.querySelectorAll('.card').length === 3 && document.querySelectorAll('.chapter').length > 0);
  await page.evaluate(() => document.fonts.ready);
  passed('Subpath export loads real game and tactic cards');
  for (const path of ['/', '/og.png', '/card.png', '/preview/og.png', '/preview/card.png']) {
    const r = await page.request.get(url + path); assert.equal(r.status(), 200);
    if (path.endsWith('.png')) assert.match(r.headers()['content-type'], /^image\/png/);
  }
  passed('Root /, nested export, and both PNG routes return HTTP 200');
  const connect = page.getByRole('button', { name: 'Connect wallet', exact: true });
  assert((await connect.boundingBox()).y < 844);
  const firstCard = await page.locator('.card').first().boundingBox();
  assert(firstCard.y >= 0 && firstCard.y + firstCard.height <= 844, 'An entire selectable guest tactic must fit on the first phone screen');
  const raidBox = await page.locator('.raid').boundingBox();
  assert(raidBox.y < (await page.locator('.hero').boundingBox()).y && raidBox.y < (await page.locator('.stats').boundingBox()).y);
  assert((await page.locator('#handTabs').boundingBox()).y < firstCard.y);
  assert(firstCard.y + firstCard.height <= (await page.locator('.raid-intro .sub').boundingBox()).y);
  assert(firstCard.y + firstCard.height <= (await page.locator('.raid-bars').boundingBox()).y);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Connect wallet');
  const focus = await connect.evaluate(e => { const s = getComputedStyle(e); return { width: s.outlineWidth, style: s.outlineStyle }; });
  assert.equal(focus.width, '2px'); assert.equal(focus.style, 'solid');
  await page.screenshot({ path: join(scratch, '390-focus.png') });
  passed('390 px first screen has active day, a complete guest tactic, connect action, and visible keyboard focus', `First card: y=${firstCard.y}, bottom=${firstCard.y + firstCard.height}`);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#wBtns')?.textContent.includes('Open in MetaMask'));
  assert(await page.locator('#wBtns a').count() >= 3);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await connect.waitFor();
  passed('Connect without an extension offers wallet app links; Back restores the action');
  const choice = page.locator('.card').first(), choiceName = await choice.locator('b').textContent();
  await choice.focus(); await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelector('.card[aria-checked="true"]'));
  assert.equal(await page.locator('.card[aria-checked="true"] b').textContent(), choiceName);
  const pick = await page.evaluate(() => Object.entries(window.__wb.myPicks()));
  assert(pick.length > 0);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('.card[aria-checked="true"]'));
  assert.equal(await page.locator('.card[aria-checked="true"] b').textContent(), choiceName);
  passed('Keyboard tactic selection sets aria-checked and persists across reload', choiceName);
  await page.locator('#raidShare').click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^Wheelbound Raid/);
  passed('Share this week copies the raid result');
  await page.locator('.chapter [data-a="copy"]').first().click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^Wheelbound · Chapter/);
  passed('Copy text copies a real generated chapter');
  const downloadEvent = page.waitForEvent('download');
  await page.locator('.chapter [data-a="save"]').first().click();
  const download = await downloadEvent;
  await download.saveAs(join(scratch, 'chapter-card.png'));
  const png = await readFile(join(scratch, 'chapter-card.png'));
  assert.equal(png.readUInt32BE(16), 1200); assert.equal(png.readUInt32BE(20), 630);
  passed('Save card downloads a valid 1200 × 630 PNG');
  const oldCount = await page.locator('.chapter').count();
  const more = page.getByRole('button', { name: /^Show older chapters/ });
  if (await more.count()) { await more.click(); assert(await page.locator('.chapter').count() > oldCount); passed('Older chapters expand the existing chronicle'); }
  const summary = page.locator('details.how summary');
  await summary.focus(); await page.keyboard.press('Enter');
  assert(await page.locator('details.how').evaluate(e => e.open));
  await page.keyboard.press('Enter');
  assert(!(await page.locator('details.how').evaluate(e => e.open)));
  passed('How Wheelbound works expands and collapses from the keyboard');
  await page.locator('#trail').focus();
  const beforeScroll = await page.locator('#trail').evaluate(e => e.scrollLeft);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(180);
  assert(await page.locator('#trail').evaluate(e => e.scrollLeft) > beforeScroll);
  passed('Trail scroll strip responds to the keyboard');
  await page.evaluate(() => scrollTo(0, 0)); await page.evaluate(() => document.fonts.ready);
  const stillA = await page.locator('#scene').evaluate(e => e.toDataURL());
  await page.waitForTimeout(120);
  const stillB = await page.locator('#scene').evaluate(e => e.toDataURL());
  assert.equal(stillA, stillB);
  assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect.getTiming().iterations === Infinity).length), 0);
  passed('Reduced-motion canvas stays deterministic; no endless CSS animation');
  const responsive = [];
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 700 : 844 });
    await page.evaluate(() => scrollTo(0, 0));
    const size = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    assert.equal(size.scroll, size.client);
    await page.screenshot({ path: join(scratch, `${width}.png`) });
    const previewLayout = await page.locator('.ov-panel').evaluate(e => {
      const text = e.querySelector('.ov-text').getBoundingClientRect(), art = e.querySelector('.ov-prev').getBoundingClientRect();
      return { textBottom: text.bottom, textRight: text.right, artTop: art.top, artLeft: art.left };
    });
    if (width <= 880) assert(previewLayout.artTop >= previewLayout.textBottom + 16, 'Stream preview must stack below its instructions');
    else assert(previewLayout.artLeft >= previewLayout.textRight + 16, 'Stream preview columns must stay separate');
    if (width === 390 || width === 1440) await page.locator('.ov-panel').screenshot({ path: join(scratch, `stream-${width}.png`) });
    responsive.push({ width, ...size });
  }
  passed('No horizontal overflow or stream-preview overlap at 320, 390, 768 and 1440 px', JSON.stringify(responsive));
  await page.locator('.raid').screenshot({ path: join(scratch, 'raid.png') });
  await page.locator('#ovCopy').click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /\/preview\/#overlay$/);
  await page.goto(url + '/preview/#overlay', { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.classList.contains('overlay'));
  const overlay = await page.evaluate(() => ({ html: getComputedStyle(document.documentElement).backgroundColor, body: getComputedStyle(document.body).backgroundColor, image: getComputedStyle(document.body).backgroundImage, regularVisible: [...document.querySelector('.wrap').children].filter(e => !e.classList.contains('ov-panel') && getComputedStyle(e).display !== 'none').length }));
  assert.equal(overlay.html, 'rgba(0, 0, 0, 0)'); assert.equal(overlay.body, 'rgba(0, 0, 0, 0)'); assert.equal(overlay.image, 'none'); assert.equal(overlay.regularVisible, 0);
  passed('Overlay link copies; #overlay retains transparent page and isolated overlay');
  // A delayed optional image must not stop the deterministic canvas fallback.
  const fallback = await context.newPage(); observe(fallback);
  let releaseArt;
  const artGate = new Promise(r => { releaseArt = r; });
  await fallback.route('**/art/night-trail.webp', async route => { await artGate; await route.continue(); });
  await fallback.goto(url + '/preview/', { waitUntil: 'domcontentloaded' });
  await fallback.waitForFunction(() => window.__wb?.S.ready && !window.__wb.S.histPaging && document.querySelectorAll('.chapter').length > 1);
  const completedDate = await fallback.evaluate(() => window.__wb.world.days.slice().reverse().find(d => d.complete && !d.isToday && document.querySelector(`.chapter[data-date="${d.date}"]`))?.date);
  assert(completedDate, 'Delayed-art check needs a real completed chapter');
  const completedChapter = fallback.locator(`.chapter[data-date="${completedDate}"]`);
  const chapterBefore = await completedChapter.locator('canvas').evaluate(e => e.toDataURL());
  const chapterSignature = await completedChapter.getAttribute('data-sig');
  const chapterText = await completedChapter.textContent();
  const unloadedCanvas = await fallback.locator('#scene').evaluate(e => e.toDataURL());
  const painted = await fallback.locator('#scene').evaluate(e => e.getContext('2d').getImageData(0, 0, e.width, e.height).data.some((v, i) => i % 4 !== 3 && v > 50));
  assert(painted); releaseArt();
  await fallback.waitForFunction(before => document.querySelector('#scene').toDataURL() !== before, unloadedCanvas);
  passed('Optional backdrop safely skips drawing until loaded, then appears');
  await fallback.waitForFunction(({ date, before }) => document.querySelector(`.chapter[data-date="${date}"] canvas`).toDataURL() !== before, { date: completedDate, before: chapterBefore });
  assert.equal(await completedChapter.getAttribute('data-sig'), chapterSignature);
  assert.equal(await completedChapter.getAttribute('data-painted'), chapterSignature);
  assert.equal(await completedChapter.textContent(), chapterText);
  const chapterAfter = await completedChapter.locator('canvas').evaluate(e => e.toDataURL());
  const fallbackMore = fallback.getByRole('button', { name: /^Show older chapters/ });
  if (await fallbackMore.count()) await fallbackMore.click();
  assert.equal(await completedChapter.locator('canvas').evaluate(e => e.toDataURL()), chapterAfter);
  passed('Completed chapter acquires delayed backdrop without changing its data, text or deterministic redraw', completedDate);
  await fallback.close();
  // Check hover styling and a live change of the system motion preference.
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const desktopPage = await desktop.newPage(); observe(desktopPage);
  await desktopPage.goto(url + '/preview/', { waitUntil: 'load' });
  await desktopPage.waitForFunction(() => window.__wb?.S?.ready && !window.__wb.S.histPaging && document.querySelector('.tab[aria-pressed="true"]') && document.querySelector('.card'));
  await desktopPage.evaluate(() => document.fonts.ready);
  const tab = desktopPage.locator('.tab[aria-pressed="true"]');
  await tab.hover(); await desktopPage.waitForTimeout(180);
  const tabColors = await desktopPage.evaluate(() => { const s = getComputedStyle(document.querySelector('.tab[aria-pressed="true"]')); return { foreground: s.color, background: s.backgroundColor }; });
  assert.equal(tabColors.foreground, 'rgb(14, 20, 32)'); assert.equal(tabColors.background, 'rgb(255, 244, 221)');
  await desktopPage.locator('.card').first().hover(); await desktopPage.waitForTimeout(180);
  assert.notEqual(await desktopPage.locator('.card').first().evaluate(e => getComputedStyle(e).transform), 'none');
  passed('Desktop selected-tab hover remains readable; card hover responds');
  await desktopPage.emulateMedia({ reducedMotion: 'reduce' });
  await desktopPage.waitForTimeout(150);
  const paused = await desktopPage.locator('#scene').evaluate(e => e.toDataURL());
  await desktopPage.waitForTimeout(150);
  assert.equal(await desktopPage.locator('#scene').evaluate(e => e.toDataURL()), paused);
  assert.equal(await desktopPage.locator('.card').first().evaluate(e => getComputedStyle(e).transform), 'none');
  passed('Changing to reduced motion pauses the live canvas and hover movement');
  await desktop.close();
  assert.deepEqual(errors, []); assert.deepEqual(localFailures, []);
  passed('No console errors, JavaScript exceptions, or failed local resources');
  await context.close();
} finally {
  if (browser) await browser.close();
  server.close();
  await writeFile(join(scratch, 'results.json'), JSON.stringify({ results, errors, localFailures }, null, 2));
}
console.log(`${results.length} browser checks passed. Wallet signing and physical devices are not exercised.`);
