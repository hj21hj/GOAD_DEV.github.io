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

  // Get current date and time for folder/filename naming
  const now = new Date();
  const dateFolder = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timestamp = now.toISOString().replace(/[:.]/g, '-');

  // Create the base directory: docs/wayback/<dateFolder>
  const baseDir = path.join('docs', 'wayback', dateFolder);
  fs.mkdirSync(baseDir, { recursive: true });

  // Launch Puppeteer with no-sandbox options for CI environments
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (let url of URLS) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Extract the domain from the URL
    const domain = new URL(url).hostname;
    const filePath = path.join(baseDir, `${domain}_${timestamp}.png`);
    // Capture full page screenshot
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Saved screenshot for ${url} at ${filePath}`);
    await page.close();
  }

  await browser.close();
})();
