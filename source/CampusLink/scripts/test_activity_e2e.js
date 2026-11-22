import assert from 'node:assert/strict';
import path from 'node:path';

// This module is invoked only by the runner that creates an isolated test DB.
export async function testActivity({ seller, buyer, productId, go, at, clickText, fill, bodyContains, intercept, output, run }) {
  async function api(page, endpoint, method = 'GET', body) {
    return page.evaluate(async (endpoint, method, body) => {
      const response = await fetch('/api' + endpoint, {
        method, headers: { Authorization: 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Activity fixture request failed: ' + response.status);
      return (await response.json()).data;
    }, endpoint, method, body);
  }
  const initial = await api(seller, '/notifications');
  if (initial.items.length) await api(seller, '/notifications/read-all', 'PATCH', { up_to_id: initial.items[0].id });
  await go(seller, '/notifications');
  await bodyContains(seller, '暂无未读');
  await go(buyer, `/product/${productId}`);
  await clickText(buyer, '.like-button', '点赞 · 0');
  await bodyContains(buyer, '已赞 · 1');
  await buyer.reload({ waitUntil: 'networkidle0' });
  await bodyContains(buyer, '已赞 · 1');
  assert.equal((await api(buyer, `/products/${productId}/like`)).liked, true);
  // Bringing the page back to the foreground checks for new messages immediately.
  await seller.bringToFront();
  await seller.evaluate(() => window.dispatchEvent(new Event('focus')));
  await seller.waitForSelector('.unread-badge');
  assert.equal(await seller.$eval('.unread-badge', e => e.textContent), '1');
  await clickText(buyer, '.like-button', '已赞 · 1');
  await bodyContains(buyer, '点赞 · 0');
  await clickText(buyer, '.like-button', '点赞 · 0');
  assert.equal((await api(seller, '/notifications')).unread_count, 1);
  console.log('PASS product likes persist, can be cancelled, do not spam, and show cross-account unread badge');

  const post = await api(seller, '/forum/posts', 'POST', { title: `消息验收 ${run}`, content: '通知与点赞体验', category: '学习' });
  await go(buyer, `/forum/${post.id}`);
  await clickText(buyer, '.like-button', '点赞 · 0');
  await bodyContains(buyer, '已赞 · 1');
  await fill(buyer, '[aria-label="评论内容"]', '收到，感谢分享！');
  await clickText(buyer, 'button', '发布评论');
  await bodyContains(buyer, '评论已发布并保存');
  await go(seller, '/notifications');
  await bodyContains(seller, `评论了你的帖子《${post.title}》`);
  assert.equal((await api(seller, '/notifications')).unread_count, 3);
  await seller.evaluate(() => [...document.querySelectorAll('.notification-card')]
    .find(c => c.textContent.includes('评论了你的帖子')).querySelector('button').click());
  await at(seller, `/forum/${post.id}`);
  await bodyContains(seller, '收到，感谢分享！');
  assert.equal((await api(seller, '/notifications')).unread_count, 2);
  const reset = await intercept(seller, r => r.method() === 'GET' && r.url().includes('/api/notifications?'));
  await go(seller, '/notifications');
  await bodyContains(seller, '网络连接失败');
  await reset();
  await clickText(seller, '.request-state button', '重试');
  await bodyContains(seller, '赞了你的帖子');
  await clickText(seller, 'button', '全部标为已读');
  await seller.waitForFunction(() => !document.querySelector('.unread-badge'));
  await clickText(seller, 'button', '未读（0）');
  await bodyContains(seller, '暂无未读消息');
  await seller.reload({ waitUntil: 'networkidle0' });
  assert.equal((await api(seller, '/notifications')).unread_count, 0);
  console.log('PASS post likes/comment notices, read-and-open, read-all persistence, unread filter, offline retry');

  await go(buyer, '/notifications');
  await bodyContains(buyer, '确认交易完成');
  await buyer.evaluate(() => [...document.querySelectorAll('.notification-card')]
    .find(c => c.textContent.includes('确认交易完成')).querySelector('button').click());
  await at(buyer, '/transactions');
  await buyer.waitForSelector('.notified-transaction');
  await bodyContains(buyer, '本条消息关联的交易');
  for (const width of [375, 390, 440]) {
    await seller.setViewport({ width, height: 812 });
    for (const route of ['/notifications', `/product/${productId}`, `/forum/${post.id}`]) {
      await go(seller, route);
      assert.equal(await seller.evaluate(() => document.documentElement.scrollWidth > innerWidth ||
        document.querySelector('.app-scroll-viewport').scrollWidth > document.querySelector('.app-scroll-viewport').clientWidth), false);
    }
  }
  await go(seller, '/notifications');
  await seller.screenshot({ path: path.join(output, 'notifications-mobile.png') });
  console.log('PASS notification transaction deep link, 375/390/440px message and like layouts');
}
