// Prepare references for a professional design tool. These assets are not a
// completed Figma/Axure project and do not replace its interactive share link.
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import puppeteer from 'puppeteer-core';
import { root, backend, python, run, stop, waitFor } from './local_runtime.js';

const stamp = new Date().toISOString().replace(/[-:.]/g, '');
const output = path.join(root, 'prototype', 'references', stamp);
const sandbox = path.join(root, '.cache', 'prototype-' + stamp);
await mkdir(output, { recursive: true });
await mkdir(sandbox, { recursive: true });
const port = await new Promise((resolve, reject) => {
  const server = createServer(); server.once('error', reject);
  server.listen(0, '127.0.0.1', () => { const value = server.address().port; server.close(() => resolve(value)); });
});
const latest = JSON.parse(await readFile(path.join(root, '.releases/latest.json'), 'utf8'));
const site = path.resolve(root, '.releases', latest.directory, 'site');
if (!site.startsWith(path.resolve(root, '.releases') + path.sep)) throw new Error('Invalid release directory');
const api = run(python, ['-m', 'uvicorn', 'src.main:app', '--host', '127.0.0.1', '--port', String(port), '--log-level', 'warning'], {
  cwd: backend,
  env: { ...process.env, CAMPUSLINK_APP_ENV: 'test', CAMPUSLINK_DEBUG: 'false',
    CAMPUSLINK_DATABASE_URL: 'sqlite:///' + path.join(sandbox, 'data.db').replaceAll('\\', '/'),
    CAMPUSLINK_UPLOAD_DIR: path.join(sandbox, 'uploads'), CAMPUSLINK_FRONTEND_DIST: site,
    CAMPUSLINK_JWT_SECRET_KEY: randomBytes(48).toString('hex'), CAMPUSLINK_AUTO_CREATE_TABLES: 'true',
    CAMPUSLINK_SEED_DEMO_DATA: 'true', TEMP: path.join(root, '.cache/tmp'), TMP: path.join(root, '.cache/tmp') }
});
const base = `http://127.0.0.1:${port}`;
let browser;
const manifest = { kind: 'reference-assets-only', tool_project_created: false, viewport: { width: 390, height: 844 }, screens: [] };
try {
  await waitFor(base + '/api/health', api);
  async function request(route, payload, token) {
    const response = await fetch(base + '/api' + route, { method: 'POST', headers: {
      'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {})
    }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error('Sandbox preparation failed: ' + response.status);
    return (await response.json()).data;
  }
  const pass = randomBytes(24).toString('hex');
  await request('/auth/register', { username: '原型体验同学', email: 'prototype-viewer@example.com', password: pass });
  const viewer = (await request('/auth/login', { username: '原型体验同学', password: pass })).token;
  const author = (await request('/auth/login', { username: '数学小佬', password: '123456' })).token;
  const post = await request('/forum/posts', { title: '期末图书馆自习经验', content: '提前规划复习时间，确认开放时间和预约规则。\n\n带好校园卡，保持安静，离开时带走个人物品。', category: '学习', image_url: '/assets/images/forum_library.png' }, author);
  await request(`/forum/posts/${post.id}/comments`, { content: '谢谢分享，准备和同学一起复习。' }, viewer);
  browser = await puppeteer.launch({ executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true, userDataDir: path.join(sandbox, 'browser'), args: ['--no-first-run', '--disable-gpu', '--edge-skip-compat-layer-relaunch'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.evaluate(token => localStorage.setItem('token', token), viewer);
  async function capture(id, title, route, action) {
    await page.goto(base + route, { waitUntil: 'networkidle0' });
    if (action) await action();
    await page.screenshot({ path: path.join(output, id + '.png') });
    const controls = await page.evaluate(() => [...document.querySelectorAll('a,button,input,textarea,select')].map(element => {
      const box = element.getBoundingClientRect();
      return { type: element.tagName.toLowerCase(), label: element.getAttribute('aria-label') || element.textContent.trim().slice(0, 60) || element.getAttribute('placeholder') || '',
        href: element.getAttribute('href'), x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
    }).filter(item => item.width > 0 && item.height > 0 && item.y < innerHeight && item.y + item.height > 0));
    manifest.screens.push({ id, title, image: id + '.png', controls });
  }
  await capture('01-home', '首页', '/');
  await capture('02-market', '闲置列表', '/idle');
  await capture('03-product', '商品详情', '/product/1');
  await capture('04-publish', '发布商品', '/publish');
  await capture('05-forum', '论坛列表', '/forum');
  await capture('06-post', '帖子详情', `/forum/${post.id}`);
  await capture('07-profile', '个人中心', '/profile');
  await capture('08-post-editor', '写帖子', '/forum/new');
  await capture('09-contact', '联系卖家弹窗', '/product/1', async () => {
    await page.evaluate(() => [...document.querySelectorAll('button')].find(e => e.textContent.trim() === '联系卖家').click());
    await page.waitForSelector('dialog[open]');
  });
  await capture('10-booking', '预订弹窗', '/product/1', async () => { await page.click('.primary-buy-btn'); await page.waitForSelector('dialog[open]'); });
  await page.evaluate(() => localStorage.removeItem('token'));
  await capture('11-login', '登录', '/login');
  await capture('12-register', '注册', '/register');
  if (errors.length) throw new Error('Prototype reference pages have runtime errors');
  await writeFile(path.join(output, 'screens.json'), JSON.stringify(manifest, null, 2));
  await writeFile(path.join(root, 'prototype', 'references', 'latest.json'), JSON.stringify({ directory: stamp }, null, 2));
  console.log(`Prepared ${manifest.screens.length} reference screens: ${path.relative(root, output)}`);
  console.log('A professional-tool project, interactions and share link still need to be created after account connection.');
} finally {
  if (browser) await browser.close();
  await stop(api);
}
