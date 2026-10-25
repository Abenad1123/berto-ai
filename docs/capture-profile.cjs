const { chromium } = require('playwright');
const path = require('path');

async function captureProfile() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  // Desktop Profile (1280x900)
  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await desktop.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click on "Edit Profile" in hero banner
  await page.click('button:has-text("Edit Profile")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'profile-desktop.png') });

  // Mobile Profile (390x844)
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mPage = await mobile.newPage();
  await mPage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await mPage.waitForTimeout(1000);
  await mPage.click('button:has-text("Edit Profile")');
  await mPage.waitForTimeout(800);
  await mPage.screenshot({ path: path.join(__dirname, 'screenshots', 'profile-mobile.png') });

  await browser.close();
  console.log('Profile screenshots captured successfully!');
}

captureProfile().catch(console.error);
