import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { testForum } from './test_forum_e2e.js';
import { testActivity } from './test_activity_e2e.js';

// Run against a disposable backend database, never against a shared deployment.
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
const api = `${base}/api`;
const output = path.resolve('.cache/e2e');
await mkdir(output, { recursive: true });
const run = Date.now().toString();
const sellerName = `seller_${run}`, buyerName = `buyer_${run}`;
const password = 'TestPass123!';
const productTitle = `联调教材 ${run}`;
const runtimeErrors = [];
const browser = await puppeteer.launch({
  executablePath: process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  userDataDir: path.resolve(`.cache/edge-e2e-${run}`),
  args: ['--disable-gpu', '--no-first-run', '--edge-skip-compat-layer-relaunch'],
});
async function pageIn(context) {
  const page = await context.newPage();
  await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 1 });
  page.setDefaultTimeout(12000);
  page.on('pageerror', e => runtimeErrors.push(e.message));
  return page;
}
async function go(page, route) { await page.goto(base + route, { waitUntil: 'networkidle0' }); }
async function fill(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.$eval(selector, element => { element.value = ''; element.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.type(selector, value);
}
async function clickText(page, selector, text) {
  await page.waitForFunction((s, t) => Array.from(document.querySelectorAll(s)).some(e => e.textContent.trim() === t && !e.disabled), {}, selector, text);
  const elements = await page.$$(selector);
  for (const element of elements) if ((await element.evaluate(e => e.textContent.trim())) === text) { await element.click(); return; }
  throw new Error(`Button not found: ${text}`);
}
async function at(page, route) { await page.waitForFunction(p => location.pathname === p, {}, route); }
async function register(page, name) {
  await fill(page, '#reg-username', name);
  await fill(page, '#reg-email', `${name}@example.com`);
  await fill(page, '#reg-pwd', password);
  await fill(page, '#reg-pwd2', password);
  await page.click('.agreement-checkbox');
  await page.click('.register-form button[type=submit]');
  await at(page, '/login');
}
async function login(page, name, pass = password) {
  await fill(page, '#login-account', name);
  await fill(page, '#login-password', pass);
  await page.click('.login-form button[type=submit]');
}
async function bodyContains(page, text) { await page.waitForFunction(t => document.body.textContent.includes(t), {}, text); }
async function chooseCover(page) {
  const input = await page.waitForSelector('input[type=file]');
  await input.uploadFile(path.resolve('public/assets/images/goods_math_book.png'));
  await page.waitForFunction(() => {
    const image = document.querySelector('.photo-img');
    return image?.getAttribute('src')?.startsWith('/api/uploads/') && image.naturalWidth > 0;
  });
}
async function publishFields(page, title) {
  await fill(page, 'input[maxlength="30"]', title);
  await fill(page, 'textarea', '九成新，校内面交。');
  await fill(page, '.price-input', '25.50');
  await clickText(page, '.chip-btn', '教材');
  await fill(page, 'input[aria-label="具体面交地点"]', '图书馆一楼');
}
async function intercept(page, predicate) {
  await page.setRequestInterception(true);
  const handler = request => predicate(request) ? request.abort('connectionfailed') : request.continue();
  page.on('request', handler);
  return async () => { await page.setRequestInterception(false); page.off('request', handler); };
}

try {
  const seller = await pageIn(await browser.createBrowserContext());
  await go(seller, '/publish');
  await at(seller, '/login');
  assert(seller.url().includes('redirect='));
  await seller.click('.register-action');
  await at(seller, '/register');
  await register(seller, sellerName);
  await login(seller, sellerName);
  await at(seller, '/publish');
  console.log('PASS registration, real login and protected-route return');

  await chooseCover(seller);
  await publishFields(seller, productTitle);
  await seller.click('.draft-btn');
  await bodyContains(seller, '草稿已保存');
  await seller.reload({ waitUntil: 'networkidle0' });
  await seller.waitForFunction(t => document.querySelector('input[maxlength="30"]')?.value === t, {}, productTitle);
  await seller.click('.footer-submit-btn');
  await seller.waitForFunction(() => /^\/product\/\d+$/.test(location.pathname));
  const productId = Number(new URL(seller.url()).pathname.split('/').pop());
  const product = (await (await fetch(`${api}/products/${productId}`)).json()).data;
  assert.equal(product.title, productTitle);
  assert.equal(product.price, 25.5);
  assert(product.image_url.startsWith('/api/uploads/'));
  assert.equal((await fetch(base + product.image_url)).status, 200);
  await seller.reload({ waitUntil: 'networkidle0' });
  await bodyContains(seller, productTitle);
  await seller.screenshot({ path: path.join(output, 'published-product.png') });
  console.log('PASS cover upload, draft restore and durable product creation');

  await seller.click('a.primary-buy-btn');
  await at(seller, `/product/${productId}/edit`);
  await fill(seller, '.price-input', '19.80');
  await seller.click('.footer-submit-btn');
  await at(seller, `/product/${productId}`);
  assert.equal((await (await fetch(`${api}/products/${productId}`)).json()).data.price, 19.8);
  console.log('PASS owner product editing');

  await go(seller, '/idle');
  await fill(seller, '.market-search input', productTitle);
  await seller.click('.market-search button');
  await seller.waitForFunction(t => document.querySelectorAll('.products-grid .product-card').length === 1 && document.querySelector('.products-grid')?.textContent.includes(t), {}, productTitle);
  await fill(seller, '.market-search input', `missing_${run}`);
  await seller.click('.market-search button');
  await bodyContains(seller, '暂无该分类');
  console.log('PASS server-side search and empty result state');

  const buyer = await pageIn(await browser.createBrowserContext());
  await go(buyer, '/login');
  await login(buyer, sellerName, 'wrong-password');
  await buyer.waitForSelector('[role=alert]');
  assert.equal(await buyer.evaluate(() => localStorage.getItem('token')), null);
  const resetLogin = await intercept(buyer, r => r.url().endsWith('/api/auth/login'));
  await login(buyer, sellerName);
  await bodyContains(buyer, '网络连接失败');
  assert.equal(await buyer.evaluate(() => localStorage.getItem('token')), null);
  await resetLogin();
  console.log('PASS wrong-password and network-error login cannot create sessions');

  await go(buyer, '/register');
  await register(buyer, buyerName);
  await login(buyer, buyerName);
  await at(buyer, '/idle');
  await go(buyer, `/product/${productId}`);
  await bodyContains(buyer, productTitle);
  await buyer.click('[aria-label="收藏商品"]');
  await bodyContains(buyer, '已收藏');
  await buyer.reload({ waitUntil: 'networkidle0' });
  await buyer.waitForFunction(() => document.querySelector('[aria-label="收藏商品"] svg')?.getAttribute('fill') !== 'none');
  await clickText(buyer, 'button.sub-btn', '联系卖家');
  await buyer.waitForSelector('dialog[open]');
  await bodyContains(buyer, `${sellerName}@example.com`);
  await buyer.click('dialog[open] [aria-label="关闭对话框"]');
  await buyer.click('.primary-buy-btn');
  await buyer.waitForSelector('dialog[open] textarea');
  await buyer.type('dialog[open] textarea', '今晚图书馆面交');
  await clickText(buyer, 'dialog[open] button', '发送预订请求');
  await at(buyer, '/transactions');
  await bodyContains(buyer, '等待卖家处理');
  await go(seller, '/transactions');
  await clickText(seller, '.account-actions button', '接受');
  await bodyContains(seller, '已接受，待面交');
  await clickText(seller, '.account-actions button', '确认面交完成');
  await clickText(seller, 'dialog[open] button', '已面交，确认完成');
  await bodyContains(seller, '已完成');
  await buyer.reload({ waitUntil: 'networkidle0' });
  await bodyContains(buyer, '已完成');
  assert.equal((await (await fetch(`${api}/products/${productId}`)).json()).data.status, 'SOLD');
  console.log('PASS durable favorites, seller contact and buyer/seller transaction completion');

  await go(seller, '/publish');
  await chooseCover(seller);
  const failedTitle = `失败重试 ${run}`;
  await publishFields(seller, failedTitle);
  const resetPublish = await intercept(seller, r => r.method() === 'POST' && r.url().endsWith('/api/products'));
  await seller.click('.footer-submit-btn');
  await bodyContains(seller, '网络连接失败');
  assert.equal(new URL(seller.url()).pathname, '/publish');
  const failedItems = (await (await fetch(`${api}/products?keyword=${encodeURIComponent(failedTitle)}`)).json()).data;
  assert.equal(failedItems.length, 0);
  await resetPublish();
  await seller.click('.footer-submit-btn');
  await seller.waitForFunction(() => /^\/product\/\d+$/.test(location.pathname));
  const deleteId = Number(new URL(seller.url()).pathname.split('/').pop());
  await go(seller, '/my-products');
  await bodyContains(seller, failedTitle);
  await seller.evaluate(title => {
    const card = [...document.querySelectorAll('.account-card')].find(c => c.textContent.includes(title));
    card.querySelector('button.danger').click();
  }, failedTitle);
  await clickText(seller, 'dialog[open] button', '确认删除');
  await seller.waitForFunction(t => !document.querySelector('.account-page')?.textContent.includes(t), {}, failedTitle);
  assert.equal((await fetch(`${api}/products/${deleteId}`)).status, 404);
  console.log('PASS failed publish stays editable, retry saves once, confirmed deletion persists');

  await testForum({ seller, buyer, pageIn, browser, go, at, fill, clickText, bodyContains, intercept, base, api, run, output });
  await testActivity({ seller, buyer, productId, go, at, clickText, fill, bodyContains, intercept, output, run });

  await go(buyer, '/favorites');
  await bodyContains(buyer, productTitle);
  await clickText(buyer, '.account-actions button', '取消收藏');
  await bodyContains(buyer, '还没有收藏');
  await go(buyer, '/profile');
  await bodyContains(buyer, buyerName);
  await buyer.evaluate(() => localStorage.setItem('token', 'invalid-session'));
  await buyer.reload({ waitUntil: 'networkidle0' });
  await at(buyer, '/login');
  assert.equal(await buyer.evaluate(() => localStorage.getItem('token')), null);
  await go(buyer, '/product/999999999');
  await bodyContains(buyer, '商品不存在');
  assert.equal(await buyer.$('.hero-image'), null);
  const resetList = await intercept(buyer, r => r.method() === 'GET' && r.url().includes('/api/products?'));
  await go(buyer, '/idle');
  await bodyContains(buyer, '网络连接失败');
  assert.equal(await buyer.$('.product-card'), null);
  await resetList();
  await clickText(buyer, '.request-state button', '重试');
  await buyer.waitForSelector('.product-card');
  console.log('PASS expired session, missing product, offline error and retry without Mock fallback');

  for (const width of [375, 390, 440]) {
    await buyer.setViewport({ width, height: 812 });
    await go(buyer, '/idle');
    const layout = await buyer.evaluate(() => ({ frame: document.querySelector('#app-mobile-frame').getBoundingClientRect().width, viewport: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth }));
    assert(layout.frame <= width + 1 && !layout.overflow, `Horizontal overflow at ${width}`);
  }
  await buyer.screenshot({ path: path.join(output, 'market-mobile.png') });
  assert.deepEqual(runtimeErrors, []);
  console.log('PASS 375/390/440px layouts and zero uncaught browser errors');
  console.log('ALL END-TO-END CHECKS PASSED');
} finally { await browser.close(); }
