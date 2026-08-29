const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  page.on('dialog', async dialog => {
    console.log('DIALOG:', dialog.message());
    await dialog.dismiss();
  });

  await page.goto('http://localhost:3000/(mor)/members'); // wait, the dev server is on 3000
  // we will wait for it to load
  await page.waitForTimeout(2000);
  
  // click on a member
  // evaluate
  await page.evaluate(() => {
    // Find the first card and click it
    const cards = document.querySelectorAll('.cursor-pointer');
    if (cards.length > 0) cards[0].click();
  });
  
  await page.waitForTimeout(1000);
  
  // Click print
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const printBtn = btns.find(b => b.textContent.includes('Download Member Tag'));
    if (printBtn) printBtn.click();
  });
  
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
