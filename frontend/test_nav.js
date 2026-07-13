import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  console.log('Navigated to /login');

  // Find and click the button with Sign in as Administrator
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Sign in as Administrator')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  
  console.log('Current URL after click:', page.url());

  await browser.close();
})();
