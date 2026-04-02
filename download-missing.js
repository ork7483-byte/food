const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ORIGIN = 'studio.jector.ai';
const ASSETS_DIR = path.join(__dirname, 'assets', ORIGIN);

// All image paths extracted from HTML
const imagePaths = [
  // _next/image referenced
  '/images/biz/profile.png','/images/biz/profile-1.png','/images/biz/profile-2.png',
  '/images/biz/test-aifoodshot-before-1.png','/images/biz/test-aifoodshot-thumbnail-1.png',
  '/images/biz/test-aifoodshot-thumbnail-2.png','/images/biz/test-aifoodshot-thumbnail-3.png',
  '/images/d-ai.jpg','/images/d-delivery.jpg','/images/d-guide.jpg','/images/d-pricing.jpg',
  '/images/d-sns.jpg','/images/d-unionpos.jpg',
  '/images/easypos.png','/images/emptyFrame.png','/images/highorder.png',
  '/images/icons/iconBean.png','/images/image.png','/images/image-1.png','/images/image-2.png',
  '/images/img-archive.png','/images/img-delivery-samples.png','/images/img-guide.png',
  '/images/img-upload-samlples.png',
  '/images/landing/foodstyler/img-addtext.jpg','/images/landing/foodstyler/img-delivery.jpg',
  '/images/landing/foodstyler/img-delivery-2.jpg','/images/landing/foodstyler/img-lighting.jpg',
  '/images/landing/foodstyler/img-map.jpg','/images/landing/foodstyler/img-pos.jpg',
  '/images/landing/foodstyler/img-poster.jpg','/images/landing/foodstyler/img-poster_letter.jpg',
  '/images/landing/foodstyler/img-removebg.jpg','/images/landing/foodstyler/img-removebg2.png',
  '/images/landing/foodstyler/img-sns.jpg','/images/landing/foodstyler/img-tableorder.jpg',
  '/images/landing/foodstyler/img-upscale.jpg',
  '/images/landing/foodstyler/feature-delivery-hero.png',
  '/images/landing/foodstyler/review-1.png','/images/landing/foodstyler/review-2.png',
  '/images/landing/foodstyler/review-3.png','/images/landing/foodstyler/review-4.png',
  '/images/m-ai.jpg','/images/m-delivery.jpg','/images/menuit.png','/images/m-guide.jpg',
  '/images/m-pricing.jpg','/images/m-sns.jpg','/images/m-unionpos.jpg',
  '/images/okpos.png','/images/partners/unionpos2.png','/images/payhere.png',
  '/images/poster_letter_intro.jpg',
  '/images/sns-1.png','/images/sns-2.png','/images/sns-3.png','/images/sns-4.png','/images/sns-5.png',
  '/images/torder.png','/images/tossplace.png','/images/unionpos.png',
  // Direct /images/ referenced
  '/images/ai-image.jpg','/images/icons/iconFacebook.svg','/images/icons/iconFileArrowUp.svg',
  '/images/icons/iconGearSix.svg','/images/icons/iconGoogle.svg','/images/icons/iconInfo.svg',
  '/images/icons/iconInstagram.svg','/images/icons/iconKakaoSpeechBubble.svg',
  '/images/icons/iconLetter.svg','/images/icons/iconMenu.svg','/images/icons/iconNavArrow.svg',
  '/images/icons/iconPicture.svg','/images/icons/iconUserCircle.svg','/images/icons/iconSlide.svg',
  '/images/icons/iconTicket.svg',
  '/images/kakaomap.svg','/images/logo/logo.svg','/images/logo/logo3.svg','/images/logo/logo6.svg',
  '/images/naverplace.svg','/images/partners/baemin.png','/images/partners/coupangeats.png',
  '/images/partners/yogiyo.png','/images/partners/ddangyo.png',
  '/images/partners/bbud.png','/images/partners/bnk.svg','/images/partners/cashnote.png',
  '/images/partners/databrain.png','/images/partners/kt.png','/images/partners/lg.svg',
  '/images/partners/lottecard.svg','/images/partners/nh.svg','/images/partners/nh_allone_logo.png',
  '/images/partners/nhnKcp.png','/images/partners/pribe.png','/images/partners/reviewdoctor.png',
  '/images/partners/sajang.png','/images/partners/selly.png','/images/partners/woowahan.svg',
  '/images/tmap.svg',
  '/images/samples/menu1.png','/images/samples/menu2.png','/images/samples/menu3.png',
  '/images/samples/menu4.png','/images/samples/menu5.png',
  '/images/samples/poster_레몬베이지.png','/images/samples/poster_레몬블루.png',
  '/images/samples/poster_발렌타인.png','/images/samples/poster_봄노을.png',
  '/images/samples/poster_봄벚꽃라벤더.png','/images/samples/poster_봄벚꽃핑크.png',
  '/images/samples/poster_여름아이스.png','/images/samples/poster_여름해변.png',
  '/images/korean-food.png','/images/chinese-food.png','/images/japanese-food.png',
  '/images/western-food.png','/images/snack-food.png','/images/dessert.png',
  '/images/korean-food-slide.jpg',
];

let downloaded = 0, skipped = 0, failed = 0, total = imagePaths.length;

function download(imgPath, idx) {
  return new Promise((resolve) => {
    const localPath = path.join(ASSETS_DIR, imgPath);
    
    // Skip if already exists
    if (fs.existsSync(localPath)) {
      skipped++;
      process.stdout.write(`\r[${idx+1}/${total}] skip: ${skipped} | dl: ${downloaded} | fail: ${failed}`);
      return resolve();
    }
    
    // Create directory
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const url = `https://${ORIGIN}${imgPath}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res2) => {
          if (res2.statusCode === 200) {
            const ws = fs.createWriteStream(localPath);
            res2.pipe(ws);
            ws.on('finish', () => { downloaded++; process.stdout.write(`\r[${idx+1}/${total}] skip: ${skipped} | dl: ${downloaded} | fail: ${failed}`); resolve(); });
          } else { failed++; process.stdout.write(`\r[${idx+1}/${total}] skip: ${skipped} | dl: ${downloaded} | fail: ${failed}`); resolve(); }
        }).on('error', () => { failed++; resolve(); });
        return;
      }
      if (res.statusCode === 200) {
        const ws = fs.createWriteStream(localPath);
        res.pipe(ws);
        ws.on('finish', () => { downloaded++; process.stdout.write(`\r[${idx+1}/${total}] skip: ${skipped} | dl: ${downloaded} | fail: ${failed}`); resolve(); });
      } else {
        failed++;
        process.stdout.write(`\r[${idx+1}/${total}] skip: ${skipped} | dl: ${downloaded} | fail: ${failed}`);
        resolve();
      }
    }).on('error', () => { failed++; resolve(); });
  });
}

(async () => {
  console.log(`\n🖼️ ${total}개 이미지 다운로드 시작...\n`);
  // Download 5 at a time
  for (let i = 0; i < imagePaths.length; i += 5) {
    const batch = imagePaths.slice(i, i + 5);
    await Promise.all(batch.map((p, j) => download(p, i + j)));
  }
  console.log(`\n\n✅ 완료! 다운로드: ${downloaded} | 이미 있음: ${skipped} | 실패: ${failed}`);
})();
