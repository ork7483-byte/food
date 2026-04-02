const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const STATIC_DIR = __dirname;
const ORIGIN = 'studio.jector.ai';

function findFreePort(start) {
  return new Promise((resolve) => {
    const net = require('net');
    const srv = net.createServer();
    srv.listen(start, () => { srv.close(() => resolve(start)); });
    srv.on('error', () => resolve(findFreePort(start + 1)));
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.bin': 'application/octet-stream',
};

function proxyToOrigin(req, res) {
  const hostname = 'www.' + ORIGIN;
  const options = {
    hostname,
    path: req.url,
    method: req.method,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': req.headers['accept'] || '*/*',
      'Accept-Encoding': 'identity',
      'Host': hostname,
    },
  };
  const proxyReq = https.request(options, (proxyRes) => {
    const headers = {
      'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    };
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (e) => { res.writeHead(502); res.end('Proxy Error'); });
  proxyReq.end();
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsed.pathname);
  res.setHeader('Access-Control-Allow-Origin', '*');

  // /_next/image → 로컬 이미지 직접 서빙
  if (pathname === '/_next/image') {
    // req.url에서 직접 url 파라미터 추출 (인코딩 이슈 방지)
    const rawUrl = req.url;
    const urlMatch = rawUrl.match(/[?&]url=([^&]+)/);
    const imgUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : (parsed.query.url || '');
    if (imgUrl) {
      // 쿼리스트링 제거하여 순수 경로만 추출
      const cleanPath = imgUrl.split('?')[0];
      const localPath = path.join(STATIC_DIR, 'assets', ORIGIN, cleanPath);
      if (fs.existsSync(localPath) && !fs.statSync(localPath).isDirectory()) {
        const ext = path.extname(localPath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'image/png', 'Cache-Control': 'public, max-age=86400' });
        fs.createReadStream(localPath).pipe(res);
        return;
      }
      // 로컬에 없으면 리다이렉트
      res.writeHead(302, { Location: cleanPath }); res.end(); return;
    }
  }

  // 로컬 에셋 폴더에서 찾기 (www. 포함/제거 둘 다)
  for (const host of [ORIGIN, 'www.' + ORIGIN]) {
    const assetPath = path.join(STATIC_DIR, 'assets', host, pathname);
    if (fs.existsSync(assetPath) && !fs.statSync(assetPath).isDirectory()) {
      const ext = path.extname(assetPath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(assetPath).pipe(res);
      return;
    }
  }

  // /images/, /videos/ 등 루트 경로 → assets/ORIGIN/ 폴더에서 찾기
  if (pathname.startsWith('/images/') || pathname.startsWith('/videos/') || pathname.startsWith('/fonts/')) {
    const assetPath = path.join(STATIC_DIR, 'assets', ORIGIN, pathname);
    if (fs.existsSync(assetPath) && !fs.statSync(assetPath).isDirectory()) {
      const ext = path.extname(assetPath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(assetPath).pipe(res);
      return;
    }
  }

  // HTML 페이지 찾기
  let filePath = path.join(STATIC_DIR, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
  if (!fs.existsSync(filePath)) {
    const htmlPath = path.join(STATIC_DIR, pathname.replace(/\/$/, '') + '.html');
    if (fs.existsSync(htmlPath)) filePath = htmlPath;
    else return proxyToOrigin(req, res);
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

findFreePort(3002).then((PORT) => {
  server.listen(PORT, () => {
    console.log('✅ http://localhost:' + PORT);
    console.log('📦 로컬 저장 파일 서빙 + 없는 건 www.' + ORIGIN + '으로 프록시');
  });
  server.on('error', e => console.error('에러:', e.message));
});
