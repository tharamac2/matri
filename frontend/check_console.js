import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => console.log('RESPONSE:', response.status(), response.url()));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.failure().errorText, request.url()));

  try {
    await page.goto('http://localhost:5173/admin/login', { waitUntil: 'networkidle0' });
    console.log("Page loaded.");
    const rect = await page.evaluate(() => {
      const el = document.querySelector('.bg-cream-100');
      if (!el) return 'not found';
      const r = el.getBoundingClientRect();
      return `width: ${r.width}, height: ${r.height}`;
    });
    console.log("RECT:", rect);
  } catch (err) {
    console.error("Error:", err);
  }
  
  await browser.close();
})();
