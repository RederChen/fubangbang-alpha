import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { root, backend, python, run, stop, waitFor } from './local_runtime.js';

// Always use a fresh local database, never a developer or deployed database.
const runId = Date.now().toString();
const runtime = path.join(root, '.cache', `sprint2-title-${runId}`);
const output = path.resolve(process.env.TITLE_TEST_OUTPUT || '.cache/sprint2-title-evidence');
await mkdir(runtime, { recursive: true });
await mkdir(path.join(output, 'screenshots'), { recursive: true });
const results = {
  startedAt: new Date().toISOString(),
  method: 'Automated real-browser and live-API verification',
  database: 'Fresh isolated SQLite database; no PostgreSQL verification',
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  sourceFiles: {}, checks: [], screenshots: [], pageErrors: [], status: 'RUNNING',
};
for (const file of ['backend/src/schemas/product.py', 'src/views/Publish.vue', 'scripts/test_product_titles_e2e.js']) {
  results.sourceFiles[file] = createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
}
const children = [];
let browser;
async function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer(); server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); });
  });
}
const apiPort = await freePort(), webPort = await freePort();
const base = `http://127.0.0.1:${webPort}`;
const env = {
  ...process.env,
  CAMPUSLINK_DATABASE_URL: `sqlite:///${path.join(runtime, 'test.db').replaceAll('\\', '/')}`,
  CAMPUSLINK_UPLOAD_DIR: path.join(runtime, 'uploads'), CAMPUSLINK_UPLOAD_STORAGE: 'local',
  CAMPUSLINK_JWT_SECRET_KEY: randomBytes(48).toString('base64url'),
  CAMPUSLINK_APP_ENV: 'development', CAMPUSLINK_DEBUG: 'false',
  CAMPUSLINK_AUTO_CREATE_TABLES: 'true', CAMPUSLINK_SEED_DEMO_DATA: 'false',
  CAMPUSLINK_FRONTEND_DIST: '', CAMPUSLINK_BACKEND_URL: `http://127.0.0.1:${apiPort}`,
  VITE_API_BASE_URL: '/api',
};
const username = `TitleSeller_${runId}`, password = 'Sprint2Check!2026';
let token;
function record(id, description, actual) {
  results.checks.push({ id, description, actual, status: 'PASS' });
  console.log(`PASS ${id}: ${description}`);
}
async function api(endpoint, method = 'GET', body) {
  const response = await fetch(base + '/api' + endpoint, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
async function go(page, route) { await page.goto(base + route, { waitUntil: 'networkidle0' }); }
async function fill(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.$eval(selector, input => { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.type(selector, value);
}
async function snap(page, name, caption) {
  await page.$eval('.publish-body', el => { el.scrollTop = 0; }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await new Promise(resolve => setTimeout(resolve, 200));
  await page.screenshot({ path: path.join(output, 'screenshots', name) });
  results.screenshots.push({ file: `screenshots/${name}`, caption, route: new URL(page.url()).pathname });
}
async function newPage() {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 2 });
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => results.pageErrors.push(error.message));
  return page;
}
async function login(page) {
  await go(page, '/login');
  await fill(page, '#login-account', username); await fill(page, '#login-password', password);
  await page.click('.login-form button[type=submit]');
  await page.waitForFunction(() => location.pathname === '/idle');
}
const titleInput = 'input[maxlength="30"]';
try {
  const server = run(python, ['-m', 'uvicorn', 'src.main:app', '--host', '127.0.0.1', '--port', String(apiPort), '--log-level', 'warning'], { cwd: backend, env });
  children.push(server); await waitFor(`http://127.0.0.1:${apiPort}/api/health`, server);
  const web = run(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { env });
  children.push(web); await waitFor(base, web);
  assert.equal((await api('/auth/register', 'POST', { username, email: `${username}@example.com`, password })).status, 201);
  const session = await api('/auth/login', 'POST', { username, password });
  assert.equal(session.status, 200); token = session.body.data.token;

  const baseline = { title: 'Original title', price: 25.5, category: '教材' };
  const valid = [['ascii30', 'A'.repeat(30)], ['padded30', '\ufeff ' + 'A'.repeat(30) + '\u3000'], ['emoji15', '😀'.repeat(15)]];
  for (const [label, supplied] of valid) {
    const created = await api('/products', 'POST', { ...baseline, title: supplied });
    assert.equal(created.status, 201); assert.equal(created.body.data.title, supplied.trim());
    const updated = await api(`/products/${created.body.data.id}`, 'PUT', { title: supplied, price: 19.8 });
    assert.equal(updated.status, 200); assert.equal(updated.body.data.title, supplied.trim());
    record(`API-${label}`, 'Creation and editing accept and normalize the same valid boundary', { http: [201, 200], normalizedUnits: supplied.trim().length });
  }
  const product = (await api('/products', 'POST', baseline)).body.data;
  for (const [label, supplied] of [['ascii31', 'A'.repeat(31)], ['blank', '\ufeff\u3000\t'], ['emoji16', '😀'.repeat(16)], ['null', null]]) {
    const created = await api('/products', 'POST', { ...baseline, title: supplied });
    const updated = await api(`/products/${product.id}`, 'PUT', { title: supplied, price: 1 });
    for (const response of [created, updated]) {
      assert.equal(response.status, 422); assert.equal(response.body.code, 422);
      assert(response.body.data.some(error => error.field === 'title'));
    }
    const stored = (await api(`/products/${product.id}`)).body.data;
    assert.equal(stored.title, baseline.title); assert.equal(stored.price, baseline.price);
    record(`API-${label}`, 'Invalid creation and update are rejected without changing stored fields', { http: [422, 422], titleUnchanged: true, priceUnchanged: true });
  }
  const priceOnly = await api(`/products/${product.id}`, 'PUT', { price: 19.8 });
  assert.equal(priceOnly.status, 200); assert.equal(priceOnly.body.data.title, baseline.title);
  record('API-omitted-title', 'Price-only update preserves the stored title', { http: 200, title: baseline.title });

  browser = await puppeteer.launch({
    executablePath: process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true, userDataDir: path.join(runtime, 'edge'),
    args: ['--disable-gpu', '--no-first-run', '--edge-skip-compat-layer-relaunch'],
  });
  let page = await newPage(); await login(page); await go(page, '/publish');
  await (await page.waitForSelector('input[type=file]')).uploadFile(path.join(root, 'public/assets/images/goods_math_book.png'));
  await page.waitForFunction(() => document.querySelector('.photo-img')?.naturalWidth > 0 && document.querySelector('.photo-img').getAttribute('src').startsWith('/api/uploads/'));
  await fill(page, '.price-input', '25.50');
  const chips = await page.$$('.chip-btn');
  for (const chip of chips) if ((await chip.evaluate(el => el.textContent.trim())) === '教材') { await chip.click(); break; }
  await fill(page, titleInput, 'A'.repeat(31));
  assert.equal(await page.$eval(titleInput, el => el.value.length), 30);
  assert.equal(await page.$eval('.char-count', el => el.textContent), '30/30');
  await snap(page, '01-title-limit-30.png', 'The browser retains 30 of 31 typed ASCII characters and displays 30/30.');
  record('UI-ascii-limit', 'Browser input and counter use the 30-unit limit', { typedUnits: 31, retainedUnits: 30 });

  await fill(page, titleInput, '😀'.repeat(15));
  assert.equal(await page.$eval(titleInput, el => el.value.length), 30);
  assert.equal(await page.$eval('.char-count', el => el.textContent), '30/30');
  record('UI-emoji-counter', 'Fifteen supplementary emoji count as 30 units', { counter: '30/30' });

  let writes = 0;
  const watchWrites = request => { if (['POST', 'PUT'].includes(request.method()) && /\/api\/products(?:\/\d+)?$/.test(new URL(request.url()).pathname)) writes++; };
  page.on('request', watchWrites);
  await fill(page, titleInput, '   '); await page.click('.footer-submit-btn');
  await page.waitForFunction(() => document.body.textContent.includes('请填写商品名称'));
  assert.equal(writes, 0);
  await snap(page, '02-blank-title-rejected.png', 'A blank title produces a field error without sending a product request.');
  record('UI-blank', 'Blank title is blocked before submission', { productRequests: writes });

  const publishedTitle = 'Sprint 2 normalized title';
  await fill(page, titleInput, `  ${publishedTitle}  `);
  assert.equal(await page.$eval('.char-count', el => el.textContent), `${publishedTitle.length}/30`);
  const submission = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/products');
  await page.click('.footer-submit-btn');
  const savedResponse = await submission; assert.equal(savedResponse.status(), 201);
  const saved = (await savedResponse.json()).data;
  await page.waitForFunction(id => location.pathname === `/product/${id}`, {}, saved.id);
  assert.equal(saved.title, publishedTitle);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(value => document.body.textContent.includes(value), {}, publishedTitle);
  await snap(page, '03-normalized-published-title.png', 'Published title is trimmed and remains visible after refresh.');
  record('UI-publish-refresh', 'Valid title is normalized, saved and survives refresh', { title: saved.title, http: 201 });

  // End the old session and sign in from an independent fresh browser context.
  await page.browserContext().close(); page = await newPage(); await login(page);
  await go(page, `/product/${saved.id}/edit`);
  await page.waitForFunction(value => document.querySelector('input[maxlength="30"]')?.value === value, {}, publishedTitle);
  await fill(page, titleInput, '  Edited title  '); await fill(page, '.price-input', '19.80');
  const editing = page.waitForResponse(response => response.request().method() === 'PUT' && new URL(response.url()).pathname === `/api/products/${saved.id}`);
  await page.click('.footer-submit-btn');
  const editResponse = await editing; assert.equal(editResponse.status(), 200);
  await page.waitForFunction(id => location.pathname === `/product/${id}`, {}, saved.id);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.body.textContent.includes('Edited title'));
  const stored = (await api(`/products/${saved.id}`)).body.data;
  assert.equal(stored.title, 'Edited title'); assert.equal(stored.price, 19.8);
  await snap(page, '04-edited-title-after-new-login.png', 'After a new login, editing stores the normalized title and new price.');
  record('UI-login-edit-refresh', 'New login and edit preserve normalized data after refresh', { title: stored.title, price: stored.price, http: 200 });

  const legacy = (await api('/products', 'POST', baseline)).body.data;
  const legacyTitle = 'L'.repeat(40);
  execFileSync(python, ['-c',
    'import sys; from src.database.session import SessionLocal; from src.models.product import Product; db=SessionLocal(); item=db.get(Product,int(sys.argv[1])); item.title=sys.argv[2]; db.commit(); db.close()',
    String(legacy.id), legacyTitle], { cwd: backend, env, windowsHide: true });
  const legacyPrice = await api(`/products/${legacy.id}`, 'PUT', { price: 19.8 });
  assert.equal(legacyPrice.status, 200); assert.equal(legacyPrice.body.data.title, legacyTitle);
  await go(page, `/product/${legacy.id}/edit`);
  await page.waitForFunction(() => document.body.textContent.includes('商品名称最多 30 个字符'));
  assert.equal(await page.$eval(titleInput, el => el.value), legacyTitle);
  assert.equal(await page.$eval('.char-count', el => el.textContent), '40/30');
  let legacyWrites = 0;
  page.on('request', request => { if (request.method() === 'PUT' && new URL(request.url()).pathname === `/api/products/${legacy.id}`) legacyWrites++; });
  await page.click('.footer-submit-btn');
  await page.waitForFunction(() => document.body.textContent.includes('请完善商品信息后再保存'));
  assert.equal(legacyWrites, 0);
  await snap(page, '05-legacy-title-requires-correction.png', 'An existing 40-unit title is preserved and flagged for correction; submission is blocked.');
  record('UI-legacy-title', 'Legacy title remains readable and is never silently truncated', { loadedUnits: 40, counter: '40/30', productUpdates: 0, priceOnlyUpdate: 200 });

  await fill(page, titleInput, 'Corrected legacy title');
  const correction = page.waitForResponse(response => response.request().method() === 'PUT' && new URL(response.url()).pathname === `/api/products/${legacy.id}`);
  await page.click('.footer-submit-btn'); assert.equal((await correction).status(), 200);
  await page.waitForFunction(id => location.pathname === `/product/${id}`, {}, legacy.id);
  assert.equal((await api(`/products/${legacy.id}`)).body.data.title, 'Corrected legacy title');
  record('UI-legacy-correction', 'A corrected legacy title saves successfully', { http: 200 });
  assert.deepEqual(results.pageErrors, []);
  results.status = 'PASS';
} catch (error) {
  results.status = 'FAIL'; results.error = error.stack || String(error);
  console.error(results.error); process.exitCode = 1;
} finally {
  results.finishedAt = new Date().toISOString();
  await writeFile(path.join(output, 'title-browser-results.json'), JSON.stringify(results, null, 2) + '\n');
  if (browser) await browser.close();
  await Promise.all(children.map(stop));
}
