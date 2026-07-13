import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  page.on('console', msg => console.log('ADMIN CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('ADMIN ERROR:', err.message));

  await page.goto('http://localhost:5173/admin/login', { waitUntil: 'networkidle0' });
  console.log('Navigated to /admin/login');
  
  const title = await page.title();
  console.log('Page Title:', title);

  const html = await page.content();
  console.log('Has email input?', html.includes('superadmin@matrimonyadmin.com') || html.includes('type="email"'));

  await browser.close();
})();
