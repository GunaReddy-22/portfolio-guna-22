const fs = require('fs');
const content = fs.readFileSync('original_portfolio/index.html', 'utf8');
const lines = content.split('\n');

const sectionMarks = [];
lines.forEach((l, idx) => {
  const m = l.match(/<(section|nav|footer)[^>]*id=["']([^"']+)["']/i);
  if (m) {
    sectionMarks.push({ line: idx + 1, tag: m[1], id: m[2] });
  } else if (l.match(/<footer/i)) {
    sectionMarks.push({ line: idx + 1, tag: 'footer', id: 'footer' });
  }
});

console.log('Section markers:', sectionMarks);

for (let i = 0; i < sectionMarks.length; i++) {
  const start = sectionMarks[i].line;
  const end = i < sectionMarks.length - 1 ? sectionMarks[i + 1].line - 1 : lines.length;
  console.log(`\nSection #${sectionMarks[i].id}: lines ${start} to ${end} (${end - start + 1} lines)`);
  // print first 5 lines and last 2 lines
  console.log('Start snippet:\n' + lines.slice(start - 1, start + 3).join('\n'));
}
