const fs = require('fs');
const path = require('path');

const htmlDir = __dirname;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let count = 0;
  
  // Replace /_next/image?url=ENCODED_PATH&w=...&q=... with the direct image path
  content = content.replace(/\/_next\/image\?url=([^"&]+)(?:&amp;[^"]*|&[^"]*)?/g, (match, encodedUrl) => {
    const decoded = decodeURIComponent(encodedUrl).split('?')[0];
    count++;
    return decoded;
  });
  
  if (count > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ${path.relative(htmlDir, filePath)}: ${count} URLs fixed`);
  }
  return count;
}

function walkDir(dir) {
  let total = 0;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && item !== 'assets' && item !== 'node_modules') {
      total += walkDir(fullPath);
    } else if (item.endsWith('.html')) {
      total += fixFile(fullPath);
    }
  }
  return total;
}

console.log('🔧 HTML 파일의 _next/image URL을 직접 이미지 경로로 변환...\n');
const total = walkDir(htmlDir);
console.log(`\n✅ 총 ${total}개 URL 변환 완료`);
