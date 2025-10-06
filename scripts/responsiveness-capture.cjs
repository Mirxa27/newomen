
// scripts/responsiveness-capture.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const DEV_URL = process.env.DEV_URL || 'http://localhost:8080';
  const OUT_DIR = path.join(process.cwd(), 'docs', 'responsiveness', 'screenshots');
  const LOG_DIR = path.join(process.cwd(), 'docs', 'responsiveness', 'logs');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(LOG_DIR, { recursive: true });

  const publicPages = [
    { path: '/', name: 'home' },
    { path: '/about', name: 'about' },
    { path: '/pricing', name: 'pricing' },
    { path: '/terms-of-service', name: 'terms-of-service' },
    { path: '/privacy-policy', name: 'privacy-policy' },
  ];

  const authPages = [
    { path: '/auth', name: 'auth' },
    { path: '/onboarding', name: 'onboarding' }
  ];

  const authenticatedPages = [
    '/dashboard',
    '/profile',
    '/account-settings',
    '/assessments',
    '/wellness-library',
    '/community',
    '/couples-challenge',
    '/narrative-identity-exploration'
  ];

  const adminPages = [
    '/admin/user-management',
    '/admin/content-management',
    '/admin/analytics',
    '/admin/api-settings',
    '/admin/ai-provider-management',
    '/admin/gamification-settings',
    '/admin/sessions-history',
    '/admin/sessions-live',
    '/admin/branding-asset-management'
  ];

  const widths = [375, 768, 1024, 1440];
  const defaultHeight = 900;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // collect console messages per page
  page._logs = [];
  page.on('console', (msg) => {
    try {
      page._logs.push(`[${msg.type()}] ${msg.text()}`);
    } catch (e) {
      page._logs.push(`[console] ${String(msg)}`);
    }
  });

  async function saveLogs(name) {
    const logs = (page._logs && page._logs.join('\n')) || '';
    try {
      fs.writeFileSync(path.join(LOG_DIR, `${name}.log`), logs, 'utf8');
    } catch (e) {
      console.error('Failed to write log', e);
    }
    page._logs = [];
  }

  async function captureUrl(urlPath, fileBase) {
    for (const w of widths) {
      await page.setViewport({ width: w, height: defaultHeight });
      const url = DEV_URL.replace(/\/$/, '') + urlPath;
      console.log(`Navigating: ${url} @ ${w}px`);
      try {
        const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        // allow client-side rendering and animations
        await page.waitForTimeout(700);
        const safeBase = fileBase.replace(/[^a-z0-9\-]/gi, '').toLowerCase() || 'page';
        const filename = `${safeBase}--${w}.png`;
        const filepath = path.join(OUT_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: true });
        await saveLogs(`${safeBase}--${w}`);
        console.log(`Saved ${filepath} (status: ${resp && resp.status ? resp.status() : 'n/a'})`);
      } catch (err) {
        console.error(`Error capturing ${url} @ ${w}px:`, err && err.message ? err.message : err);
        await saveLogs(`${fileBase}--${w}-error`);
      }
    }
  }

  async function attemptLogin(email, password) {
    try {
      const authUrl = DEV_URL.replace(/\/$/, '') + '/auth';
      await page.goto(authUrl, { waitUntil: 'networkidle2', timeout: 20000 });
      await page.waitForTimeout(400);

      // Try to click "Sign In" toggle if present (form defaults to Sign Up)
      const signInButton = await page.$x("//button[contains(., 'Sign In')]");
      if (signInButton && signInButton.length > 0) {
        await signInButton[0].click();
        await page.waitForTimeout(300);
      }

      // Fill credentials
      const emailSel = '#email';
      const passSel = '#password';
      await page.waitForSelector(emailSel, { timeout: 5000 });
      await page.click(emailSel, { clickCount: 3 });
      await page.type(emailSel, email, { delay: 30 });
      await page.click(passSel, { clickCount: 3 });
      await page.type(passSel, password, { delay: 30 });

      // Submit the form (there is a submit button)
      // Find a button[type="submit"]
      const submit = await page.$('button[type="submit"], form button[type="submit"]');
      if (submit) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null),
          submit.click(),
        ]);
        await page.waitForTimeout(800);
        console.log('Login attempted');
        return true;
      } else {
        console.warn('Submit button not found on auth page');
        return false;
      }
    } catch (err) {
      console.error('Login failed:', err && err.message ? err.message : err);
      return false;
    }
  }

  try {
    // 1) Public pages
    for (const p of publicPages) {
      await captureUrl(p.path, p.name);
    }

    // 2) Auth pages
    for (const p of authPages) {
      await captureUrl(p.path, p.name);
    }

    // 3) If TEST credentials exist, attempt login and capture authenticated pages
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPass = process.env.TEST_USER_PASS;
    const adminEmail = process.env.ADMIN_USER_EMAIL;
    const adminPass = process.env.ADMIN_USER_PASS;

    if (testEmail && testPass) {
      console.log('TEST_USER_EMAIL found in env - attempting user login for deeper captures');
      const ok = await attemptLogin(testEmail, testPass);
      if (ok) {
        for (const p of authenticatedPages) {
          await captureUrl(p, `auth${p.replace(/\//g, '-')}`);
        }
      } else {
        console.warn('User login attempt failed; skipping authenticated page captures');
      }
    } else {
      console.log('No test user credentials provided; skipping authenticated page captures');
    }

    // 4) Admin routes - attempt admin login if admin creds exist
    if (adminEmail && adminPass) {
      console.log('ADMIN_USER_EMAIL found in env - attempting admin login for admin captures');
      // navigate to /auth and login then navigate to /admin
      const okAdmin = await attemptLogin(adminEmail, adminPass);
      if (okAdmin) {
        for (const p of adminPages) {
          await captureUrl(p, `admin${p.replace(/\//g, '-')}`);
        }
      } else {
        console.warn('Admin login attempt failed; skipping admin page captures');
      }
    } else {
      console.log('No admin credentials provided; skipping admin page captures');
    }

    console.log('Capture run complete');
  } catch (err) {
    console.error('Unexpected error during capture run:', err);
  } finally {
    await browser.close();
  }
})();
