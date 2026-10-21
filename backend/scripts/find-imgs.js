const fs = require('fs');
const content = fs.readFileSync('original_portfolio/index.html', 'utf8');
const matches = [...content.matchAll(/<img[^>]+src="([^"]+)"/g)];
matches.forEach((m, i) => {
  console.log(`Image ${i}: src starts with "${m[1].substring(0, 30)}..." total length: ${m[1].length}`);
});
