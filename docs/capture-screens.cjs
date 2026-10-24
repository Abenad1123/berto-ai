const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureScreens() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2 // HiDPI Retina
  });

  const page = await context.newPage();

  // 1. Dashboard Light
  console.log('1. Capturing dashboard-light.png...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-light.png') });

  // 2. Open Settings Hub Modal
  console.log('2. Capturing settings-hub.png...');
  const settingsBtn = await page.$('button[aria-label="Settings"], button:has(svg.lucide-settings)');
  if (settingsBtn) {
    await settingsBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, 'settings-hub.png') });
    // Close modal
    const closeBtn = await page.$('button:has(svg.lucide-x)');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(600);
  }

  // 3. Open Deck View
  console.log('3. Navigating to Deck View...');
  // Find a deck card
  const deckCards = await page.$$('.tactile-card');
  if (deckCards.length > 0) {
    await deckCards[0].click();
    await page.waitForTimeout(1200);
    console.log('   Capturing deck-view.png...');
    await page.screenshot({ path: path.join(screenshotsDir, 'deck-view.png') });

    // Open Study Launcher
    console.log('4. Opening Study Launcher...');
    const studyBtn = await page.$('button.tactile-btn-emerald');
    if (studyBtn) {
      await studyBtn.click();
      await page.waitForTimeout(800);
      console.log('   Capturing study-launcher.png...');
      await page.screenshot({ path: path.join(screenshotsDir, 'study-launcher.png') });

      // Click Start Study Session
      const startBtn = await page.$('button:has-text("Enter Quiz Arena"), button:has-text("Start Study Session")');
      if (startBtn) {
        await startBtn.click();
        await page.waitForTimeout(1500);
        console.log('5. Capturing quiz-session.png...');
        await page.screenshot({ path: path.join(screenshotsDir, 'quiz-session.png') });
      }
    }
  }

  // 6. Dark Mode Dashboard
  console.log('6. Capturing dashboard-dark.png...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('berto_theme', 'dark');
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-dark.png') });

  await browser.close();
  console.log('SUCCESS! All high-res screenshots saved to docs/screenshots/');
}

captureScreens().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
