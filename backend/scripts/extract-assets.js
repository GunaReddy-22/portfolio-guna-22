const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('original_portfolio/index.html', 'utf8');
const assetDir = path.join(__dirname, '../extracted_assets');
if (!fs.existsSync(assetDir)) {
  fs.mkdirSync(assetDir, { recursive: true });
}

const matches = [...content.matchAll(/<img[^>]+src="([^"]+)"/g)];
if (matches[0]) {
  const b64 = matches[0][1].replace(/^data:image\/[^;]+;base64,/, '');
  const buf = Buffer.from(b64, 'base64');
  fs.writeFileSync(path.join(assetDir, 'hero-portrait.jpg'), buf);
  console.log('Saved hero-portrait.jpg, size:', buf.length, 'bytes');
}

if (matches[1]) {
  const b64 = matches[1][1].replace(/^data:image\/[^;]+;base64,/, '');
  const buf = Buffer.from(b64, 'base64');
  fs.writeFileSync(path.join(assetDir, 'resume-preview.png'), buf);
  console.log('Saved resume-preview.png, size:', buf.length, 'bytes');
}
