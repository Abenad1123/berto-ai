const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureProfileAndMenu() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  // 1. Mobile Hamburger Menu
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  // Click hamburger button in header
  const menuBtn = await mobilePage.$('button[aria-label="Open navigation menu"]');
  if (menuBtn) {
    await menuBtn.click();
    await mobilePage.waitForTimeout(600);
    console.log('Capturing mobile-sidebar-menu.png...');
    await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile-sidebar-menu.png') });
  }

  // 2. Profile Page (Mobile)
  const profileLink = await mobilePage.$('button:has-text("View Profile"), span:has-text("Profile")');
  if (profileLink) {
    await profileLink.click();
    await mobilePage.waitForTimeout(800);
    console.log('Capturing mobile-profile-page.png...');
    await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile-profile-page.png') });
  }

  // 3. Desktop Profile Page
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);

  const desktopProfile = await desktopPage.$('[aria-label="User Profile"]');
  if (desktopProfile) {
    await desktopProfile.click();
    await desktopPage.waitForTimeout(800);
    console.log('Capturing desktop-profile-page.png...');
    await desktopPage.screenshot({ path: path.join(screenshotsDir, 'desktop-profile-page.png') });
  }

  await browser.close();
  console.log('Captured profile and menu screenshots!');
}

captureProfileAndMenu().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
