import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeAttr, sanitizeUrl, sanitizeRichText } from './helpers/sanitize.js';
import { renderBlock } from './helpers/renderers.js';
import { CmsBlockSchema } from '../src/schema/index.js';

describe('Stored XSS Mitigation & Complete 12-Block Coverage', () => {
  describe('A. Sanitization Utility Functions', () => {
    it('escapes special HTML characters in text', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml("Guna's Portfolio & Apps")).toBe(
        'Guna&#39;s Portfolio &amp; Apps'
      );
    });

    it('escapes characters in attributes', () => {
      expect(escapeAttr('" onmouseover="alert(1)" data-x="')).toBe(
        '&quot; onmouseover=&quot;alert(1)&quot; data-x=&quot;'
      );
    });

    it('strictly validates URLs and rejects dangerous protocols and obfuscations', () => {
      // Safe URLs
      expect(sanitizeUrl('https://gunasai.in')).toBe('https://gunasai.in');
      expect(sanitizeUrl('http://localhost:3000')).toBe('http://localhost:3000');
      expect(sanitizeUrl('mailto:me@gunasai.in')).toBe('mailto:me@gunasai.in');
      expect(sanitizeUrl('tel:+919381888078')).toBe('tel:+919381888078');
      expect(sanitizeUrl('#projects')).toBe('#projects');
      expect(sanitizeUrl('/assets/resume.pdf')).toBe('/assets/resume.pdf');

      // Malicious URLs -> rejected to fallback '#'
      expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('#');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
      expect(sanitizeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('#');
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('#');
      expect(sanitizeUrl('//evil.com/phish')).toBe('#');
      expect(sanitizeUrl('/\\evil.com')).toBe('#');

      // Obfuscated and entity-encoded schemes
      expect(sanitizeUrl('jav\tascript:alert(1)')).toBe('#');
      expect(sanitizeUrl('jav\nascript:alert(1)')).toBe('#');
      expect(sanitizeUrl('jav\rascript:alert(1)')).toBe('#');
      expect(sanitizeUrl('java\0script:alert(1)')).toBe('#');
      expect(sanitizeUrl('j a v a s c r i p t :alert(1)')).toBe('#');
      expect(sanitizeUrl('javascript&#58;alert(1)')).toBe('#');
      expect(sanitizeUrl('javascript&colon;alert(1)')).toBe('#');
      expect(sanitizeUrl('jav&#x09;ascript:alert(1)')).toBe('#');
    });

    it('sanitizes rich text: removes scripts, event handlers, and handles unquoted javascript', () => {
      const dirty = '<p>Hello <strong>World</strong><script>alert(1)</script><a href=javascript:alert(2)>Click</a></p>';
      const clean = sanitizeRichText(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('javascript:');
      expect(clean).toContain('Hello');
      expect(clean).toContain('<strong>World</strong>');
    });

    it('adversarial test: rejects encoded and whitespace-obfuscated URL schemes', () => {
      const payloads = [
        '<a href="jav&#x09;ascript:alert(1)">link</a>',
        '<a href="jav&#x0A;ascript:alert(2)">link</a>',
        '<a href="jav&#x0D;ascript:alert(3)">link</a>',
        '<a href="java&#0000001script:alert(4)">link</a>',
        '<a href="javascript&#58;alert(5)">link</a>',
        '<a href="data:text/html,<script>alert(6)</script>">link</a>',
        '<a href="vbscript:alert(7)">link</a>',
      ];
      for (const p of payloads) {
        const clean = sanitizeRichText(p);
        expect(clean).not.toContain('javascript:');
        expect(clean).not.toContain('data:');
        expect(clean).not.toContain('vbscript:');
        expect(clean).not.toContain('alert');
      }
    });

    it('adversarial test: strips malformed nested tags and tag boundary tricks', () => {
      const dirty = '<<script>script>alert(1)<</script>/script><p>Safe Paragraph</p>';
      const clean = sanitizeRichText(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert(1)');
      expect(clean).toContain('Safe Paragraph');
    });

    it('adversarial test: strips mixed-case event attributes', () => {
      const dirty = '<p oNeRroR="alert(1)" OnClIcK="alert(2)" oNlOaD="alert(3)" onmouseover="alert(4)">Interactive Text</p>';
      const clean = sanitizeRichText(dirty);
      expect(clean).not.toMatch(/on\w+=/i);
      expect(clean).toContain('Interactive Text');
      expect(clean).toBe('<p>Interactive Text</p>');
    });

    it('adversarial test: rejects SVG and MathML payloads', () => {
      const svgPayload = '<svg><script>alert(1)</script><circle r="10"/></svg>';
      const mathPayload = '<math><mi xlink:href="javascript:alert(1)">click</mi></math>';
      const animPayload = '<svg><animate xlink:href="#x" attributeName="href" values="javascript:alert(1)"/></svg>';

      expect(sanitizeRichText(svgPayload)).not.toContain('<svg');
      expect(sanitizeRichText(svgPayload)).not.toContain('alert(1)');
      expect(sanitizeRichText(mathPayload)).not.toContain('<math');
      expect(sanitizeRichText(mathPayload)).not.toContain('xlink:href');
      expect(sanitizeRichText(animPayload)).not.toContain('<animate');
    });

    it('adversarial test: strips xlink:href attribute from any element', () => {
      const dirty = '<a xlink:href="javascript:alert(1)">link with xlink</a>';
      const clean = sanitizeRichText(dirty);
      expect(clean).not.toContain('xlink:href');
      expect(clean).not.toContain('javascript:alert(1)');
    });

    it('adversarial test: strips malformed comments and XML processing instructions', () => {
      const dirty = '<!--<script>alert(1)</script>--> <!--> <script>alert(2)</script> --> <?xml-stylesheet href="javascript:alert(3)"?><p>Visible</p>';
      const clean = sanitizeRichText(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert(2)');
      expect(clean).not.toContain('xml-stylesheet');
      expect(clean).toContain('Visible');
    });

    it('adversarial test: forbids nested dangerous elements (form, object, embed, iframe)', () => {
      const dirty = `
        <form action="javascript:alert(1)"><input type="text"><button type="submit">Submit</button></form>
        <object data="javascript:alert(2)"><param name="src" value="evil.swf"></object>
        <embed src="javascript:alert(3)">
        <iframe src="https://evil.com"></iframe>
        <p>Allowed Content</p>
      `;
      const clean = sanitizeRichText(dirty);
      expect(clean).not.toContain('<form');
      expect(clean).not.toContain('<input');
      expect(clean).not.toContain('<button');
      expect(clean).not.toContain('<object');
      expect(clean).not.toContain('<embed');
      expect(clean).not.toContain('<iframe');
      expect(clean).toContain('Allowed Content');
    });

    it('adversarial test: cleans broken HTML containing event handlers', () => {
      const dirty = '<b onmouseover=alert(1)>Hover me</b><img src=x onerror=alert(2)><a href=javascript:alert(3)>Broken Link';
      const clean = sanitizeRichText(dirty);
      expect(clean).not.toContain('onmouseover');
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('javascript:alert(3)');
      expect(clean).toContain('Hover me');
    });

    it('preserves valid bold, italic, paragraph, list, code, and safe links', () => {
      const valid = '<p><strong>Bold</strong> <em>Italic</em> <code>const x = 1;</code></p><ul><li>Item 1</li><li>Item 2</li></ul><ol><li>Step 1</li></ol><blockquote>Quote</blockquote><a href="https://gunasai.in" target="_blank">Safe Portfolio</a>';
      const clean = sanitizeRichText(valid);
      expect(clean).toContain('<strong>Bold</strong>');
      expect(clean).toContain('<em>Italic</em>');
      expect(clean).toContain('<code>const x = 1;</code>');
      expect(clean).toContain('<ul><li>Item 1</li><li>Item 2</li></ul>');
      expect(clean).toContain('<ol><li>Step 1</li></ol>');
      expect(clean).toContain('<blockquote>Quote</blockquote>');
      expect(clean).toContain('href="https://gunasai.in"');
      expect(clean).toContain('rel="noopener noreferrer"');
    });
  });

  describe('B. All 12 Section Block Renderers Coverage', () => {
    const defaultBlockMeta = {
      schemaVersion: 1,
      isVisible: true,
      order: 0,
      layout: { containerWidth: 'default' as const, alignment: 'left' as const, paddingTop: 'default', paddingBottom: 'default' },
      style: { showGlow: true },
    };

    it('1. renders hero block with escaped content and safe links', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-hero',
        type: 'hero',
        ...defaultBlockMeta,
        content: {
          headlineNameFirst: 'GUNA <script>alert(1)</script>',
          photoUrl: 'https://gunasai.in/photo.jpg',
          ctaButtons: [{ label: 'Malicious CTA', url: 'javascript:alert("hero")', style: 'primary' }],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('id="hero"');
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(html).not.toContain('javascript:alert');
      expect(html).toContain('href="#"');
    });

    it('1b. renders hero announcement pill with dynamic icon matching tag (e.g. OPEN TO WORK -> 💼)', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-hero',
        type: 'hero',
        ...defaultBlockMeta,
        content: {
          pillIsAnnouncement: true,
          pillAnnouncementTag: 'OPEN TO WORK',
          pillText: 'Full Stack Engineer',
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('hero-pill-announcement');
      expect(html).toContain('<span class="pill-announcement-icon" aria-hidden="true">💼</span>OPEN TO WORK');

      // Test custom icon override
      const customBlock = CmsBlockSchema.parse({
        id: 'sec-hero-custom',
        type: 'hero',
        ...defaultBlockMeta,
        content: {
          pillIsAnnouncement: true,
          pillAnnouncementTag: 'SUPERCHARGED',
          pillAnnouncementIcon: '⚡',
          pillText: 'Available immediately',
        },
      });

      const customHtml = renderBlock(customBlock);
      expect(customHtml).toContain('<span class="pill-announcement-icon" aria-hidden="true">⚡</span>SUPERCHARGED');
    });

    it('2. renders about block with quick facts and escaped paragraphs', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-about',
        type: 'about',
        ...defaultBlockMeta,
        content: {
          headline: 'Engineered with <b onmouseover=alert(1)>curiosity</b>.',
          bodyParagraphs: ['Clean bio text.'],
          quickFacts: [{ key: 'Role', value: 'Architect' }],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('id="about"');
      expect(html).toContain('&lt;b onmouseover=alert(1)&gt;curiosity&lt;/b&gt;');
    });

    it('3. renders skills block independently as a standalone section', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-skills',
        type: 'skills',
        ...defaultBlockMeta,
        content: {
          sectionTitle: 'Technical Toolkit',
          groups: [
            {
              name: 'Backend Engineering',
              skills: [{ name: 'TypeScript' }, { name: 'Node.js' }],
            },
          ],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('id="skills"');
      expect(html).toContain('Technical Toolkit');
      expect(html).toContain('Backend Engineering');
      expect(html).toContain('TypeScript');
    });

    it('4. renders experience block safely', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-exp',
        type: 'experience',
        ...defaultBlockMeta,
        content: {
          entries: [
            {
              id: 'exp1',
              role: 'Full Stack Engineer',
              company: 'ZenithIndia',
              dateRange: '2026',
              summary: 'Summary text',
              points: ['Built APIs with <script>'],
            },
          ],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('id="experience"');
      expect(html).toContain('ZenithIndia');
      expect(html).toContain('&lt;script&gt;');
    });

    it('5. renders projects block with sanitized live and download URLs', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-proj',
        type: 'projects',
        ...defaultBlockMeta,
        content: {
          projects: [
            {
              id: 'proj1',
              num: '01',
              tag: 'Full-Stack',
              name: 'ReviewOS',
              description: 'AI-powered reviews',
              techPills: ['React', 'Node.js'],
              points: ['Production app'],
              liveUrl: 'javascript:stealCredentials()',
              downloadUrl: 'https://downloads.gunasai.in/app.apk',
            },
          ],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('id="projects"');
      expect(html).toContain('ReviewOS');
      expect(html).not.toContain('javascript:stealCredentials()');
      expect(html).toContain('href="https://downloads.gunasai.in/app.apk"');
    });

    it('6. renders education block safely', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-edu',
        type: 'education',
        ...defaultBlockMeta,
        content: {
          entries: [
            {
              id: 'edu1',
              year: '2024 - 2028',
              degree: 'B.Tech',
              school: 'NIT Delhi',
              score: '8.04 CGPA',
            },
          ],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('id="education"');
      expect(html).toContain('NIT Delhi');
      expect(html).toContain('8.04 CGPA');
    });

    it('7. renders highlights block safely', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-hl',
        type: 'highlights',
        ...defaultBlockMeta,
        content: {
          highlights: [
            {
              id: 'hl1',
              icon: '⚡',
              title: 'DSA Practitioner',
              description: 'Solved 100+ LeetCode problems',
            },
          ],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('id="highlights"');
      expect(html).toContain('DSA Practitioner');
    });

    it('8. renders resume block safely', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-res',
        type: 'resume',
        ...defaultBlockMeta,
        content: {
          frameLabel: 'Resume.pdf',
          previewImageUrl: '/assets/resume.png',
          downloadPdfUrl: 'javascript:alert("pdf")',
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('id="resume"');
      expect(html).not.toContain('javascript:alert("pdf")');
    });

    it('9. renders contact block with sanitized tel and mailto links', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-con',
        type: 'contact',
        ...defaultBlockMeta,
        content: {
          contactLinks: [
            {
              id: 'c1',
              type: 'email',
              label: 'Email',
              value: 'me@gunasai.in',
              href: 'mailto:me@gunasai.in',
              icon: '✉',
            },
          ],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('id="contact"');
      expect(html).toContain('mailto:me@gunasai.in');
    });

    it('10. renders form block with secure form attributes', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-form',
        type: 'form',
        ...defaultBlockMeta,
        content: {
          formSlug: 'contact-form"><script>alert(1)</script>',
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('cms-contact-form');
      expect(html).not.toContain('<script>alert(1)</script>');
    });

    it('11. renders richText block with sanitization', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-rich',
        type: 'richText',
        ...defaultBlockMeta,
        content: {
          headline: 'Custom Rich Text',
          html: '<h3>Safe Title</h3><p>Safe paragraph</p><script>alert("evil")</script>',
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('Safe Title');
      expect(html).toContain('Safe paragraph');
      expect(html).not.toContain('<script>');
    });

    it('12. renders gallery block with image cards', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-gal',
        type: 'gallery',
        ...defaultBlockMeta,
        content: {
          headline: 'Featured Visuals',
          items: [
            {
              id: 'g1',
              imageUrl: 'https://gunasai.in/screenshot.jpg',
              alt: 'Architecture Diagram',
              caption: 'System Topology',
              order: 0,
            },
          ],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('id="gallery"');
      expect(html).toContain('https://gunasai.in/screenshot.jpg');
      expect(html).toContain('Architecture Diagram');
      expect(html).toContain('System Topology');
    });

    it('returns empty string when block.isVisible is false', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-hidden',
        type: 'hero',
        schemaVersion: 1,
        isVisible: false,
        order: 0,
        layout: { containerWidth: 'default', alignment: 'left', paddingTop: 'default', paddingBottom: 'default' },
        style: { showGlow: true },
        content: {},
      });

      expect(renderBlock(block)).toBe('');
    });
  });

  describe('C. Adversarial Sanitization Through Actual Rendering Path', () => {
    const defaultBlockMeta = {
      schemaVersion: 1,
      isVisible: true,
      order: 0,
      layout: { containerWidth: 'default' as const, alignment: 'left' as const, paddingTop: 'default', paddingBottom: 'default' },
      style: { showGlow: true },
    };

    it('neutralizes adversarial payloads inside richText block renderer', () => {
      const adversarialHtml = `
        <h3>Heading</h3>
        <p>Paragraph with <a href="jav&#x09;ascript:alert(1)">bad link</a> and <b onmouseover="alert('xss')">bold</b></p>
        <svg onload="alert(2)"><script>alert(3)</script></svg>
        <math><mi xlink:href="javascript:alert(4)">click</mi></math>
        <iframe src="javascript:alert(5)"></iframe>
      `;
      const block = CmsBlockSchema.parse({
        id: 'sec-adv-rich',
        type: 'richText',
        ...defaultBlockMeta,
        content: {
          headline: 'Secured Rich Text',
          html: adversarialHtml,
        },
      });

      const rendered = renderBlock(block);
      expect(rendered).toContain('Heading');
      expect(rendered).toContain('Secured Rich Text');
      expect(rendered).toContain('<b>bold</b>');
      expect(rendered).not.toContain('javascript:');
      expect(rendered).not.toContain('onmouseover');
      expect(rendered).not.toContain('<svg');
      expect(rendered).not.toContain('<script');
      expect(rendered).not.toContain('<math');
      expect(rendered).not.toContain('<iframe');
      expect(rendered).not.toContain('alert(');
    });

    it('neutralizes obfuscated javascript URLs across all project and CTA link fields', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-proj-xss',
        type: 'projects',
        ...defaultBlockMeta,
        content: {
          projects: [
            {
              id: 'p-xss',
              num: '99',
              tag: 'Security',
              name: 'Attack Project',
              description: 'Testing link sanitization',
              techPills: [],
              points: [],
              liveUrl: 'jav\tascript:alert("live")',
              sourceUrl: 'javascript&#58;alert("source")',
              downloadUrl: 'data:text/html,<script>alert("dl")</script>',
            },
          ],
        },
      });

      const rendered = renderBlock(block);
      expect(rendered).not.toContain('jav\tascript:');
      expect(rendered).not.toContain('javascript&#58;');
      expect(rendered).not.toContain('data:text/html');
      expect(rendered).not.toContain('alert("live")');
      expect(rendered).not.toContain('alert("source")');
      expect(rendered).not.toContain('alert("dl")');
      // All malicious URLs replaced with fallback '#'
      expect(rendered).toContain('href="#"');
    });

    it('neutralizes malicious resume and contact action links', () => {
      const resumeBlock = CmsBlockSchema.parse({
        id: 'sec-res-xss',
        type: 'resume',
        ...defaultBlockMeta,
        content: {
          downloadPdfUrl: 'vbscript:msgbox("pdf")',
          previewImageUrl: 'javascript:alert("img")',
        },
      });
      const renderedResume = renderBlock(resumeBlock);
      expect(renderedResume).not.toContain('vbscript:');
      expect(renderedResume).not.toContain('javascript:');

      const contactBlock = CmsBlockSchema.parse({
        id: 'sec-con-xss',
        type: 'contact',
        ...defaultBlockMeta,
        content: {
          contactLinks: [
            { id: 'c-xss', type: 'email', label: 'Email', value: 'x@x.com', href: 'javascript:steal()', icon: '✉' },
          ],
        },
      });
      const renderedContact = renderBlock(contactBlock);
      expect(renderedContact).not.toContain('javascript:steal()');
    });
  });

  describe('D. Complete Dynamic Editability of Repeatable Content', () => {
    const defaultBlockMeta = {
      schemaVersion: 1,
      isVisible: true,
      order: 0,
      layout: { containerWidth: 'default' as const, alignment: 'left' as const, paddingTop: 'default', paddingBottom: 'default' },
      style: { showGlow: true },
    };

    it('dynamically renders multiple, edited, and reordered experience entries', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-exp-dyn',
        type: 'experience',
        ...defaultBlockMeta,
        content: {
          sectionTitle: 'Career Trajectory',
          headline: 'Production engineering experience',
          entries: [
            {
              id: 'exp-latest',
              role: 'Staff Platform Engineer',
              company: 'NextGen Cloud Inc',
              dateRange: 'Jan 2026 - Present',
              location: 'Remote, US',
              summary: 'Leading distributed systems architecture',
              points: ['Scaled Kafka pipeline by 10x', 'Engineered Zero-Trust Auth'],
            },
            {
              id: 'exp-earlier',
              role: 'Senior Full Stack Engineer',
              company: 'HyperScale Systems',
              dateRange: '2024 - 2026',
              location: 'Bengaluru, IN',
              summary: 'Built full stack CMS and edge runtimes',
              points: ['Delivered sub-10ms SSR', 'Authored TypeScript microservices'],
            },
          ],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('Career Trajectory');
      expect(html).toContain('Production engineering experience');
      expect(html).toContain('Staff Platform Engineer');
      expect(html).toContain('NextGen Cloud Inc');
      expect(html).toContain('Jan 2026 - Present');
      expect(html).toContain('Scaled Kafka pipeline by 10x');
      expect(html).toContain('HyperScale Systems');
      expect(html).toContain('Delivered sub-10ms SSR');

      // Verify DOM ordering matches array order (reordering support)
      const pos1 = html.indexOf('Staff Platform Engineer');
      const pos2 = html.indexOf('Senior Full Stack Engineer');
      expect(pos1).toBeLessThan(pos2);
    });

    it('dynamically renders multiple projects with custom badges, tech pills, and download metadata', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-proj-dyn',
        type: 'projects',
        ...defaultBlockMeta,
        content: {
          sectionTitle: 'Featured Creations',
          headline: 'High-impact software projects',
          projects: [
            {
              id: 'p-1',
              num: '01',
              tag: 'Production AI',
              name: 'Autonomous Agent Platform',
              description: 'Multi-agent orchestration runtime with memory and tools.',
              techPills: ['TypeScript', 'Node.js', 'Redis', 'Docker'],
              points: ['Sub-second latency', '99.99% uptime'],
              liveUrl: 'https://agentplatform.example.com',
              sourceUrl: 'https://github.com/example/agents',
              aiBadge: 'Agentic Core',
              platformBadge: { text: 'Production Ready', type: 'web' },
            },
            {
              id: 'p-2',
              num: '02',
              tag: 'Systems',
              name: 'Distributed Vector DB',
              description: 'Embedded HNSW indexing engine in Rust.',
              techPills: ['Rust', 'Wasm', 'WebGPU'],
              points: ['Zero allocation queries'],
              downloadUrl: 'https://downloads.example.com/engine.tar.gz',
              downloadNote: 'v2.4.0 (Universal Binary)',
            },
          ],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('Featured Creations');
      expect(html).toContain('Autonomous Agent Platform');
      expect(html).toContain('Agentic Core');
      expect(html).toContain('Production Ready');
      expect(html).toContain('Distributed Vector DB');
      expect(html).toContain('v2.4.0 (Universal Binary)');
      expect(html).toContain('Rust');
      expect(html).toContain('https://downloads.example.com/engine.tar.gz');
    });

    it('dynamically renders skills with custom category names and skill lists', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-skills-dyn',
        type: 'skills',
        ...defaultBlockMeta,
        content: {
          sectionTitle: 'Engineered Disciplines',
          subtitle: 'Core competencies across software engineering',
          groups: [
            {
              name: 'Cloud Infrastructure & SRE',
              skills: [{ name: 'Kubernetes' }, { name: 'Terraform' }, { name: 'Prometheus' }],
            },
            {
              name: 'AI & Data Engineering',
              skills: [{ name: 'LangChain' }, { name: 'PyTorch' }, { name: 'ChromaDB' }],
            },
          ],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('Engineered Disciplines');
      expect(html).toContain('Cloud Infrastructure &amp; SRE');
      expect(html).toContain('Kubernetes');
      expect(html).toContain('Terraform');
      expect(html).toContain('AI &amp; Data Engineering');
      expect(html).toContain('PyTorch');
    });

    it('dynamically renders education and academic milestones', () => {
      const block = CmsBlockSchema.parse({
        id: 'sec-edu-dyn',
        type: 'education',
        ...defaultBlockMeta,
        content: {
          sectionTitle: 'Academic Foundation',
          headline: 'Degrees and institutional training',
          entries: [
            {
              id: 'edu-ms',
              year: '2028 - 2030',
              degree: 'M.S. in Computer Science',
              school: 'Stanford University',
              score: '4.0 GPA',
            },
            {
              id: 'edu-btech',
              year: '2024 - 2028',
              degree: 'B.Tech in Artificial Intelligence',
              school: 'NIT Delhi',
              score: '9.2 CGPA',
            },
          ],
        },
      });

      const html = renderBlock(block);
      expect(html).toContain('Academic Foundation');
      expect(html).toContain('M.S. in Computer Science');
      expect(html).toContain('Stanford University');
      expect(html).toContain('4.0 GPA');
      expect(html).toContain('B.Tech in Artificial Intelligence');
      expect(html).toContain('9.2 CGPA');
    });
  });
});


