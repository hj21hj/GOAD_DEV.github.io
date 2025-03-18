const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  // List of websites to archive
  const URLS = [
    'https://www.example.com',
    'https://www.example2.com'
    // Add more URLs as needed
  ];

  const now = new Date();
  const dateFolder = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timestamp = now.toISOString().replace(/[:.]/g, '-');

  // 변경: docs/wayback 대신 루트의 wayback 폴더에 저장
  const baseDir = path.join('wayback', dateFolder);
  fs.mkdirSync(baseDir, { recursive: true });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (let url of URLS) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const domain = new URL(url).hostname;
    const filePath = path.join(baseDir, `${domain}_${timestamp}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Saved screenshot for ${url} at ${filePath}`);
    await page.close();
  }

  await browser.close();
})();
