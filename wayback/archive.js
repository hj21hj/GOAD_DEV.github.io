const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  // 아카이브할 웹사이트 URL 목록
  const URLS = [
    'https://www.example.com',
    'https://www.example2.com'
    // 추가 URL을 이곳에 입력하세요.
  ];

  const now = new Date();
  // docs 폴더 내에 날짜별 디렉토리 (예: 20250318)
  const dateFolder = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const baseDir = path.join('docs', dateFolder);
  fs.mkdirSync(baseDir, { recursive: true });

  // Puppeteer 실행 (CI 환경에서는 sandbox 옵션 비활성화)
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  for (let url of URLS) {
    const page = await browser.newPage();
    // 페이지가 완전히 로드될 때까지 대기 (네트워크가 한가할 때)
    await page.goto(url, { waitUntil: 'networkidle2' });
    // URL의 도메인을 파일 이름에 사용
    const domain = new URL(url).hostname;
    const filePath = path.join(baseDir, `${domain}_${timestamp}.png`);
    // 전체 페이지 스크린샷 저장
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Saved screenshot for ${url} at ${filePath}`);
    await page.close();
  }

  await browser.close();
})();
