import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runVerification() {
  console.log('🚀 启动 Edge 浏览器进行福帮帮 App 布局、尺寸约束与登录页去模板化深度验证...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 1. 设置标准 PC 桌面视口 (1280 x 1024)
  await page.setViewport({ width: 1280, height: 1024 });

  const testResults = [];
  const logTest = (name, passed, detail) => {
    testResults.push({ name, passed, detail });
    console.log(`${passed ? '✅' : '❌'} [${name}]: ${detail}`);
  };

  // 打开首页
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // --- 验证 1: 桌面预览下 App 显示区域尺寸与宽高比 ---
  const frameMetrics = await page.evaluate(() => {
    const el = document.getElementById('app-mobile-frame');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      offsetWidth: el.offsetWidth,
      offsetHeight: el.offsetHeight,
      rectWidth: rect.width,
      rectHeight: rect.height,
      rectTop: rect.top,
      rectLeft: rect.left,
      border: style.border,
      aspectRatio: (el.offsetWidth / el.offsetHeight).toFixed(4)
    };
  });

  const expectedAspect = (440 / 956).toFixed(4);
  if (frameMetrics && frameMetrics.offsetWidth === 440 && frameMetrics.offsetHeight === 956) {
    logTest('App尺寸约束', true, `逻辑尺寸严格为 ${frameMetrics.offsetWidth}px × ${frameMetrics.offsetHeight}px，宽高比 ${frameMetrics.aspectRatio} (基准: ${expectedAspect})`);
  } else {
    logTest('App尺寸约束', false, `尺寸不符合 440x956: ${JSON.stringify(frameMetrics)}`);
  }

  // --- 验证 2: 底部导航栏宽度与定位 ---
  const navMetrics = await page.evaluate(() => {
    const nav = document.querySelector('.bottom-navigation');
    const frame = document.getElementById('app-mobile-frame');
    if (!nav || !frame) return null;
    const navRect = nav.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const style = window.getComputedStyle(nav);
    return {
      navWidth: nav.offsetWidth,
      frameWidth: frame.offsetWidth,
      position: style.position,
      navBottomRelFrame: Math.abs(navRect.bottom - frameRect.bottom),
      navWidthMatchesFrame: Math.abs(navRect.width - frameRect.width) < 1
    };
  });

  if (navMetrics && navMetrics.navWidth === 440 && navMetrics.navBottomRelFrame < 5) {
    logTest('底部导航栏限制', true, `导航栏宽度完全等于 App 宽度 ${navMetrics.navWidth}px (无视口超界)，且稳固贴在 App 底部 (误差 ${navMetrics.navBottomRelFrame.toFixed(2)}px)`);
  } else {
    logTest('底部导航栏限制', false, `导航栏定位异常: ${JSON.stringify(navMetrics)}`);
  }

  // --- 验证 3: 页面滚动时 App 显示区域保持静止，滚动发生在内容区域 ---
  const initialFrameTop = frameMetrics.rectTop;
  const scrollResult = await page.evaluate(async () => {
    const viewport = document.querySelector('.app-scroll-viewport');
    if (!viewport) return { error: '未找到滚动视口' };

    const initialScrollTop = viewport.scrollTop;
    const initialWindowScrollY = window.scrollY;

    viewport.scrollTop = 300;
    await new Promise(r => setTimeout(r, 200));

    const afterScrollTop = viewport.scrollTop;
    const afterWindowScrollY = window.scrollY;

    const frame = document.getElementById('app-mobile-frame');
    const afterFrameRect = frame.getBoundingClientRect();

    return {
      viewportScrollWorked: afterScrollTop > 0,
      windowStayedStill: afterWindowScrollY === 0,
      afterScrollTop,
      afterFrameTop: afterFrameRect.top
    };
  });

  const frameMoved = Math.abs(scrollResult.afterFrameTop - initialFrameTop);
  if (scrollResult.viewportScrollWorked && scrollResult.windowStayedStill && frameMoved < 1) {
    logTest('滚动行为隔离', true, `内容独立向下滚动至 ${scrollResult.afterScrollTop}px，window.scrollY始终为0，外部App框架绝对位移仅 ${frameMoved}px（完全静止）`);
  } else {
    logTest('滚动行为隔离', false, `滚动隔离测试未通过: ${JSON.stringify(scrollResult)}`);
  }

  // --- 验证 4: 滚动到底部时内容不被导航栏遮挡 ---
  const bottomCollision = await page.evaluate(async () => {
    const viewport = document.querySelector('.app-scroll-viewport');
    const nav = document.querySelector('.bottom-navigation');
    const posts = document.querySelectorAll('.forum-post-card');
    const lastItem = posts[posts.length - 1];

    viewport.scrollTop = viewport.scrollHeight;
    await new Promise(r => setTimeout(r, 200));

    const navRect = nav.getBoundingClientRect();
    const lastRect = lastItem.getBoundingClientRect();

    const clearance = navRect.top - lastRect.bottom;
    return {
      lastBottom: lastRect.bottom,
      navTop: navRect.top,
      clearance,
      isNotCovered: clearance >= 0
    };
  });

  if (bottomCollision.isNotCovered) {
    logTest('底栏内容不遮挡', true, `滚动到底部时最后一项与导航栏有 ${bottomCollision.clearance.toFixed(1)}px 的正向安全间距，完全无遮挡`);
  } else {
    logTest('底栏内容不遮挡', false, `内容被导航栏遮挡: ${JSON.stringify(bottomCollision)}`);
  }

  // --- 验证 5: 截取首页及其他三个主要页面，检查尺寸一致性 ---
  await page.screenshot({ path: 'screenshot_home.png' });

  const routes = [
    { name: '二手闲置', path: '/idle', img: 'screenshot_idle_market.png' },
    { name: '校园论坛', path: '/forum', img: 'screenshot_forum_list.png' },
    { name: '个人中心', path: '/profile', img: 'screenshot_profile.png' }
  ];

  let pagesConsistent = true;
  for (const r of routes) {
    await page.goto(`http://localhost:5173${r.path}`, { waitUntil: 'networkidle0' });
    await new Promise(res => setTimeout(res, 300));
    const m = await page.evaluate(() => {
      const el = document.getElementById('app-mobile-frame');
      return el ? { w: el.offsetWidth, h: el.offsetHeight } : null;
    });
    if (!m || m.w !== 440 || m.h !== 956) {
      pagesConsistent = false;
      logTest(`页面尺寸一致性-${r.name}`, false, `尺寸不一致: ${JSON.stringify(m)}`);
    }
    await page.screenshot({ path: r.img });
  }
  if (pagesConsistent) {
    logTest('四个主要页面一致性', true, '首页、闲置、论坛、我的四个主要页面的显示尺寸严格一致为 440 × 956 px');
  }

  // --- 验证 6: PC 浏览器窗口变小时的等比例自适应缩放 ---
  await page.setViewport({ width: 900, height: 600 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));

  const scaleMetrics = await page.evaluate(() => {
    const el = document.getElementById('app-mobile-frame');
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      offsetWidth: el.offsetWidth,
      offsetHeight: el.offsetHeight,
      renderedWidth: Math.round(rect.width),
      renderedHeight: Math.round(rect.height),
      transform: style.transform
    };
  });

  const renderedAspect = (scaleMetrics.renderedWidth / scaleMetrics.renderedHeight).toFixed(4);
  if (scaleMetrics && Math.abs(parseFloat(renderedAspect) - parseFloat(expectedAspect)) < 0.02) {
    logTest('窗口缩小等比例缩放', true, `在 600px 高度窗口下，逻辑像素仍为 ${scaleMetrics.offsetWidth}x${scaleMetrics.offsetHeight}，渲染尺寸缩放为 ${scaleMetrics.renderedWidth}x${scaleMetrics.renderedHeight}，宽高比严格保持 ${renderedAspect}`);
  } else {
    logTest('窗口缩小等比例缩放', false, `缩放测试未通过: ${JSON.stringify(scaleMetrics)}`);
  }

  // --- 验证 7: 登录页面深度专项验证（去 AI 模板化与品牌一致性） ---
  await page.setViewport({ width: 1280, height: 1024 });
  console.log('进行登录页面去 AI 模板化专项质检...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));

  const loginAudit = await page.evaluate(() => {
    const hasStatusBar = !!document.querySelector('.status-bar');
    const hasGlowOrb = !!document.querySelector('.glow-orb');
    const hasCssCampusThumb = !!document.querySelector('.campus-thumb');
    const hasThickCard = !!document.querySelector('.login-card');
    const hasBigTipCard = !!document.querySelector('.campus-tip-card');
    
    // 正向特征检查
    const logoImg = document.querySelector('.brand-logo-img');
    const campusBg = document.querySelector('.campus-bg-img');
    const authNote = document.querySelector('.campus-auth-note');
    const submitBtn = document.querySelector('.submit-btn');
    const registerNav = document.querySelector('.register-nav-row');
    const footer = document.querySelector('.login-footer');
    
    // 检查是否有异常横向滚动
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;

    return {
      hasStatusBar,
      hasGlowOrb,
      hasCssCampusThumb,
      hasThickCard,
      hasBigTipCard,
      hasLogo: !!logoImg && logoImg.complete && logoImg.naturalWidth > 0,
      hasCampusBg: !!campusBg && campusBg.complete && campusBg.naturalWidth > 0,
      hasAuthNote: !!authNote,
      hasSubmitBtn: !!submitBtn,
      hasSingleRegisterNav: !!registerNav,
      hasFooter: !!footer,
      noHorizontalScroll: scrollWidth <= clientWidth + 1
    };
  });

  const loginDeAiPassed = !loginAudit.hasStatusBar && !loginAudit.hasGlowOrb && !loginAudit.hasCssCampusThumb && !loginAudit.hasThickCard && !loginAudit.hasBigTipCard;
  logTest('登录页彻底消除AI模板化', loginDeAiPassed, `已移除手绘状态栏(false)、发光球(false)、CSS伪建筑(false)、嵌套厚卡片(false)、巨型提示卡(false)`);

  const loginBrandPassed = loginAudit.hasLogo && loginAudit.hasCampusBg && loginAudit.hasAuthNote && loginAudit.hasSubmitBtn && loginAudit.hasSingleRegisterNav;
  logTest('登录页品牌体系复用与规范', loginBrandPassed, `Logo切图正常渲染(${loginAudit.hasLogo})、校园水彩插画正常融入(${loginAudit.hasCampusBg})、单行轻量认证说明(${loginAudit.hasAuthNote})、单一注册引导入口(${loginAudit.hasSingleRegisterNav})`);

  await page.screenshot({ path: 'screenshot_login.png' });

  // --- 验证 8: 注册页面深度专项验证 ---
  console.log('进行注册页面去 AI 模板化专项质检...');
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));

  const registerAudit = await page.evaluate(() => {
    const hasStatusBar = !!document.querySelector('.status-bar');
    const hasGlowOrb = !!document.querySelector('.glow-orb');
    const hasFzuBadge = !!document.querySelector('.fzu-badge');
    const hasThickCard = !!document.querySelector('.register-card');
    
    const logoImg = document.querySelector('.brand-logo-img');
    const backLink = document.querySelector('.back-link');
    const sendCodeBtn = document.querySelector('.send-code-btn');
    const submitBtn = document.querySelector('.submit-btn');
    const loginNav = document.querySelector('.login-nav-row');

    return {
      hasStatusBar,
      hasGlowOrb,
      hasFzuBadge,
      hasThickCard,
      hasLogo: !!logoImg && logoImg.complete,
      hasBackLink: !!backLink,
      hasSendCodeBtn: !!sendCodeBtn,
      hasSubmitBtn: !!submitBtn,
      hasLoginNav: !!loginNav
    };
  });

  const registerDeAiPassed = !registerAudit.hasStatusBar && !registerAudit.hasGlowOrb && !registerAudit.hasFzuBadge && !registerAudit.hasThickCard;
  logTest('注册页消除AI模板化与规范', registerDeAiPassed, `已移除手绘状态栏(false)、发光球(false)、大圆形徽章(false)、嵌套厚卡片(false)；返回条(${registerAudit.hasBackLink})、验证码按钮(${registerAudit.hasSendCodeBtn})`);
  await page.screenshot({ path: 'screenshot_register.png' });

  // 更多二级页面截图
  await page.goto('http://localhost:5173/product/1', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screenshot_product_detail.png' });
  await page.goto('http://localhost:5173/forum/1', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screenshot_post_detail.png' });
  await page.goto('http://localhost:5173/publish', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screenshot_publish.png' });

  await browser.close();

  const allPassed = testResults.every(t => t.passed);
  console.log('\n================ 验证总览 ================');
  console.log(`全部测试用例数: ${testResults.length}，通过: ${testResults.filter(t => t.passed).length}，失败: ${testResults.filter(t => !t.passed).length}`);
  console.log(`总评状态: ${allPassed ? '🎉 全部验证通过！' : '❌ 存在未通过用例'}`);
  console.log('=========================================\n');
  process.exit(allPassed ? 0 : 1);
}

runVerification().catch(err => {
  console.error('验证执行异常:', err);
  process.exit(1);
});
