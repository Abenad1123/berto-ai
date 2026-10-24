const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureMobileScreens() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  // Mobile Viewport: 390x844 (iPhone 14 standard)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  // 1. Mobile Home Dashboard
  console.log('1. Capturing mobile-dashboard.png (390x844)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotsDir, 'mobile-dashboard.png') });

  // 2. Open Deck View on Mobile
  console.log('2. Navigating to Deck View on Mobile...');
  const deckCards = await page.$$('.tactile-card');
  if (deckCards.length > 0) {
    await deckCards[0].click();
    await page.waitForTimeout(1200);
    console.log('   Capturing mobile-deck-view.png...');
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-deck-view.png') });

    // Open Study Launcher on Mobile
    console.log('3. Opening Study Launcher on Mobile...');
    const studyBtn = await page.$('button.tactile-btn-emerald');
    if (studyBtn) {
      await studyBtn.click();
      await page.waitForTimeout(800);
      console.log('   Capturing mobile-study-launcher.png...');
      await page.screenshot({ path: path.join(screenshotsDir, 'mobile-study-launcher.png') });

      // Start Quiz Session on Mobile
      const startBtn = await page.$('button:has-text("Enter Quiz Arena"), button:has-text("Start Study Session")');
      if (startBtn) {
        await startBtn.click();
        await page.waitForTimeout(1500);
        console.log('4. Capturing mobile-quiz-session.png...');
        await page.screenshot({ path: path.join(screenshotsDir, 'mobile-quiz-session.png') });
      }
    }
  }

  // 5. Narrow 360px viewport test (Small Android)
  console.log('5. Testing 360x740 Narrow Android Viewport...');
  const smallContext = await browser.newContext({
    viewport: { width: 360, height: 740 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const smallPage = await smallContext.newPage();
  await smallPage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await smallPage.waitForTimeout(1200);
  console.log('   Capturing mobile-360-dashboard.png...');
  await smallPage.screenshot({ path: path.join(screenshotsDir, 'mobile-360-dashboard.png') });

  await browser.close();
  console.log('Mobile verification screenshots captured successfully!');
}

captureMobileScreens().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
