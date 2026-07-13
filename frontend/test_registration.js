import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    
    // Step 1: Profile for
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(el => el.textContent === 'My-self'));
    const mySelfBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'My-self');
    });
    await mySelfBtn.click();
    
    // Step 2: Gender
    await page.waitForFunction(() => document.body.innerText.includes('Select the gender'));
    const maleBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Male');
    });
    await maleBtn.click();
    
    // Step 3: Details
    await page.waitForSelector('input[placeholder="Enter name"]');
    await page.type('input[placeholder="Enter name"]', 'Puppeteer Test User');
    await page.type('input[placeholder="Mobile number"]', '5551234567');
    await page.type('input[placeholder="Password"]', 'secretpassword');
    const nextBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Next');
    });
    await nextBtn.click();
    
    // Step 4: OTP
    await page.waitForSelector('.otp-box');
    const otpBoxes = await page.$$('.otp-box');
    await otpBoxes[0].type('1');
    await otpBoxes[1].type('2');
    await otpBoxes[2].type('3');
    await otpBoxes[3].type('4');
    
    const verifyBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Verify');
    });
    await verifyBtn.click();
    
    // Wait for the next step indicating success
    await page.waitForFunction(() => document.body.innerText.includes('Number verified'));
    console.log("Registration successful!");
    
  } catch (err) {
    console.error("Error during registration test:", err);
  } finally {
    await page.close();
    browser.disconnect();
  }
})();
