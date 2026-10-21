const fs = require('fs');
const html = fs.readFileSync('original_portfolio/index.html', 'utf8');

const resumeIdx = html.indexOf('id="resume"');
const contactIdx = html.indexOf('id="contact"');
const footerIdx = html.indexOf('<footer');

console.log('--- RESUME SECTION (excluding long base64) ---');
const resumeText = html.slice(resumeIdx, contactIdx);
console.log(resumeText.replace(/src="data:image\/[^"]+"/g, 'src="[BASE64_IMAGE]"').replace(/href="data:image\/[^"]+"/g, 'href="[BASE64_DOWNLOAD]"'));

console.log('--- CONTACT SECTION ---');
console.log(html.slice(contactIdx, footerIdx));
