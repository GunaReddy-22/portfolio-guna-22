const fs = require('fs');
const html = fs.readFileSync('original_portfolio/index.html', 'utf8');

const sectionIds = ['about', 'experience', 'projects', 'education', 'highlights', 'resume', 'contact'];

sectionIds.forEach(id => {
  const re = new RegExp('<section[^>]*id=["\']' + id + '["\'][^>]*>([\\s\\S]*?)<\\/section>', 'i');
  const m = html.match(re);
  if (m) {
    console.log(`\n================== SECTION: #${id} ==================`);
    // print first 600 chars of section text without tags
    const cleanText = m[1].replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    console.log(cleanText.slice(0, 500) + '...');
  } else {
    console.log(`Section #${id} not found!`);
  }
});
