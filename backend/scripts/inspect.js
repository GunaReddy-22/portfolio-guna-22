const fs = require('fs');

const html = fs.readFileSync('original_portfolio/index.html', 'utf8');

// Find style block
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
const styleContent = styleMatch ? styleMatch[1] : '';

// Extract CSS root variables
const rootMatch = styleContent.match(/:root\s*\{([\s\S]*?)\}/i);
const rootVars = rootMatch ? rootMatch[1].trim().split(';').map(s => s.trim()).filter(Boolean) : [];

// Extract section tags and IDs
const tagRegex = /<(section|nav|footer|header)[^>]*id=["']?([^"' >]+)["']?[^>]*>/gi;
let match;
const sections = [];
while ((match = tagRegex.exec(html)) !== null) {
  sections.push({ tag: match[1], id: match[2] });
}

// Find images
const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*alt=["']?([^"']*)["']?[^>]*>/gi;
const images = [];
while ((match = imgRegex.exec(html)) !== null) {
  const isBase64 = match[1].startsWith('data:');
  images.push({
    isBase64,
    type: isBase64 ? match[1].split(';')[0] : 'url',
    length: match[1].length,
    alt: match[2]
  });
}

// Extract navigation links
const navLinks = [];
const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
while ((match = linkRegex.exec(html)) !== null) {
  navLinks.push({ href: match[1], text: match[2].replace(/<[^>]+>/g, '').trim() });
}

console.log('=== CSS Root Variables ===');
console.log(rootVars);

console.log('\n=== Sections with ID ===');
console.log(sections);

console.log('\n=== Images Found ===');
console.log(images);

console.log('\n=== Sample Links ===');
console.log(navLinks.slice(0, 15));
