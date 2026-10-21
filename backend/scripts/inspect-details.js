const fs = require('fs');
const html = fs.readFileSync('original_portfolio/index.html', 'utf8');

// Projects:
console.log('--- PROJECTS ---');
const projCards = [...html.matchAll(/<div class="proj-card">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi)];
const cardRegex = /<div class="proj-card">([\s\S]*?)(?=<div class="proj-card">|<\/div>\s*<\/section>)/gi;
let pMatch;
let pCount = 0;
while ((pMatch = cardRegex.exec(html)) !== null) {
  pCount++;
  const c = pMatch[1];
  const name = (c.match(/<h3 class="proj-name">([\s\S]*?)<\/h3>/i) || [])[1];
  const tag = (c.match(/<div class="proj-tag">([\s\S]*?)<\/div>/i) || [])[1];
  const pills = [...c.matchAll(/<span class="ppill">([\s\S]*?)<\/span>/gi)].map(m => m[1]);
  console.log(`Project ${pCount}: ${name?.trim()} [${tag?.trim()}] Pills: ${pills.join(', ')}`);
}

// Skills:
console.log('\n--- SKILL BLOCKS ---');
const skillRegex = /<div class="skill-block">([\s\S]*?)<\/div>\s*<\/div>/gi;
let sMatch;
const sbRegex = /<div class="skill-block">([\s\S]*?)<\/div>\s*<\/div>/gi;
const sbTags = [...html.matchAll(/<div class="sb-label">([\s\S]*?)<\/div>\s*<div class="sb-tags">([\s\S]*?)<\/div>/gi)];
sbTags.forEach((s, idx) => {
  const label = s[1].trim();
  const tags = [...s[2].matchAll(/<span class="sb-tag">([\s\S]*?)<\/span>/gi)].map(m => m[1].trim());
  console.log(`Skill Group ${idx + 1}: ${label} -> ${tags.join(', ')}`);
});

// Experience
console.log('\n--- EXPERIENCE ---');
const expMatch = html.match(/<div class="exp-card">([\s\S]*?)<\/div>\s*<\/div>/i);
if (expMatch) {
  const role = (expMatch[1].match(/<div class="exp-role">([\s\S]*?)<\/div>/i) || [])[1]?.trim();
  const comp = (expMatch[1].match(/<div class="exp-company">([\s\S]*?)<\/div>/i) || [])[1]?.trim();
  const date = (expMatch[1].match(/<div class="exp-date">([\s\S]*?)<\/div>/i) || [])[1]?.trim();
  console.log(`${role} @ ${comp} (${date})`);
}

// Education
console.log('\n--- EDUCATION ---');
const eduRows = [...html.matchAll(/<div class="edu-row">([\s\S]*?)<\/div>\s*(?=<div class="edu-row">|<\/div>\s*<\/section>)/gi)];
eduRows.forEach(er => {
  const yr = (er[1].match(/<div class="edu-year">([\s\S]*?)<\/div>/i) || [])[1]?.trim();
  const deg = (er[1].match(/<div class="edu-degree">([\s\S]*?)<\/div>/i) || [])[1]?.trim();
  const sch = (er[1].match(/<div class="edu-school">([\s\S]*?)<\/div>/i) || [])[1]?.trim();
  const scr = (er[1].match(/<div class="edu-score">([\s\S]*?)<\/div>/i) || [])[1]?.trim();
  console.log(`${yr} | ${deg} | ${sch} | ${scr}`);
});
