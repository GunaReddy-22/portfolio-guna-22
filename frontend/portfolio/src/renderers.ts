export interface CmsBlock {
  id?: string;
  type: string;
  order?: number;
  isVisible?: boolean;
  content: any;
  customCss?: string;
}
import { escapeHtml, escapeAttr, sanitizeUrl, sanitizeRichText } from './sanitize.js';

export function renderBlock(block: CmsBlock): string {
  if (!block || !block.isVisible) return '';

  switch (block.type) {
    case 'hero': {
      const c = (block.content || {}) as any;
      const tagsHtml = (c.floatingTags || [])
        .map((t: string, i: number) => `<div class="float-tag ft${(i % 5) + 1}">${escapeHtml(t)}</div>`)
        .join('');

      const ctaHtml = (c.ctaButtons || [])
        .map(
          (b: any) =>
            `<a href="${sanitizeUrl(b.url)}" class="${
              b.style === 'primary' ? 'btn-primary' : 'btn-secondary'
            }">${escapeHtml(b.label)}</a>`
        )
        .join('');

      const statsHtml = (c.stats || [])
        .map(
          (s: any) => `
        <div class="hstat">
          <div class="hstat-num">${escapeHtml(s.number)}<span class="suf">${escapeHtml(s.suffix || '')}</span></div>
          <div class="hstat-label">${escapeHtml(s.label)}</div>
        </div>
      `
        )
        .join('');

      const marqueeHtml = (c.marqueeItems || [])
        .map((m: string) => `<span>${escapeHtml(m)}</span>`)
        .join('');

      const photoUrl = sanitizeUrl(c.photoUrl, '/assets/hero-portrait.jpg');
      const photoAlt = escapeAttr(c.photoAlt || 'Hero portrait');

      return `
        <section id="hero">
          <div class="orb1 hero-orb"></div>
          <div class="orb2 hero-orb"></div>
          <div class="orb3 hero-orb"></div>
          <div class="bg-grid"></div>
          ${tagsHtml}
          <div class="hero-inner">
            <div class="hero-text">
              <div class="hero-pill"><span class="pulse"></span>${escapeHtml(c.pillText || '')}</div>
              <div class="hero-eyebrow"><span class="eyebrow-dash"></span>${escapeHtml(c.eyebrowText || '')}</div>
              <h1 class="hero-name">
                ${escapeHtml(c.headlineNameFirst || '')}<span class="name-serif">${escapeHtml(
        c.headlineNameMiddle || ''
      )}</span><span class="name-last">${escapeHtml(c.headlineNameLast || '')}</span>
              </h1>
              <p class="hero-desc">${escapeHtml(c.description || '')}</p>
              <div class="hero-btns">${ctaHtml}</div>
              <div class="hero-stats">${statsHtml}</div>
            </div>
            <div class="hero-photo-wrap">
              <div class="hero-photo-ring"></div>
              <div class="hero-photo-frame">
                <div class="photo-corner pc-tl"></div>
                <div class="photo-corner pc-br"></div>
                <img src="${photoUrl}" alt="${photoAlt}" />
                ${
                  c.badge?.enabled !== false
                    ? `
                  <div class="photo-badge">
                    <div class="pb-dot"></div>
                    <div class="pb-text">${escapeHtml(c.badge?.tag || 'OPEN TO WORK')}<strong>${escapeHtml(
                        c.badge?.role || 'Full-Stack & AI Roles'
                      )}</strong></div>
                  </div>
                `
                    : ''
                }
              </div>
            </div>
          </div>
        </section>
        <div class="marquee-strip">
          <div class="marquee-inner">
            ${marqueeHtml}${marqueeHtml}
          </div>
        </div>
      `;
    }

    case 'about': {
      const c = (block.content || {}) as any;
      const paragraphsHtml = (c.bodyParagraphs || [])
        .map((p: string) => `<p class="about-body">${escapeHtml(p)}</p>`)
        .join('');

      const factsHtml = (c.quickFacts || [])
        .map(
          (f: any) => `
        <div class="arow">
          <div class="arow-key">${escapeHtml(f.key)}</div>
          <div class="arow-val">${
            f.link
              ? `<a href="${sanitizeUrl(f.link)}" target="_blank" rel="noopener">${escapeHtml(f.value)}</a>`
              : escapeHtml(f.value)
          }</div>
        </div>
      `
        )
        .join('');

      const skillsHtml = (c.skillGroups || [])
        .map(
          (g: any) => `
        <div class="skill-block">
          <div class="sb-label">${escapeHtml(g.label)}</div>
          <div class="sb-tags">
            ${(g.tags || []).map((t: string) => `<span class="sb-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
      `
        )
        .join('');

      return `
        <section id="about" class="section">
          <div class="section-glow"></div>
          <div class="section-inner">
            <div class="sec-label reveal"><span class="sec-label-num">${escapeHtml(
              c.sectionNum || '01'
            )}</span><span class="sec-label-line"></span>${escapeHtml(c.sectionTitle || 'About')}</div>
            <h2 class="sec-title reveal">${escapeHtml(c.headline || 'Engineered by curiosity.')}</h2>
            <div class="about-grid">
              <div class="reveal">
                <p class="about-intro">${escapeHtml(c.introText || '')}</p>
                ${paragraphsHtml}
                <div class="about-rows">${factsHtml}</div>
              </div>
              <div class="skills-stack reveal d1">${skillsHtml}</div>
            </div>
          </div>
        </section>
      `;
    }

    case 'skills': {
      const c = (block.content || {}) as any;
      // Handle both { groups: [{ category, items }] } and { groups: [{ name, skills: [{ name }] }] }
      const groups = c.groups || c.skillGroups || [];
      const skillsHtml = groups
        .map((g: any) => {
          const label = g.label || g.category || g.name || 'Skills';
          const rawItems = g.tags || g.items || g.skills || [];
          const tags = rawItems.map((item: any) => (typeof item === 'string' ? item : item.name || ''));
          return `
          <div class="skill-block">
            <div class="sb-label">${escapeHtml(label)}</div>
            <div class="sb-tags">
              ${tags.map((t: string) => `<span class="sb-tag">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>
        `;
        })
        .join('');

      return `
        <section id="skills" class="section">
          <div class="section-glow"></div>
          <div class="section-inner">
            <div class="sec-label reveal"><span class="sec-label-num">${escapeHtml(
              c.sectionNum || '01B'
            )}</span><span class="sec-label-line"></span>${escapeHtml(c.sectionTitle || 'Technical Skills')}</div>
            <h2 class="sec-title reveal">${escapeHtml(c.headline || c.subtitle || 'Core technical toolkit.')}</h2>
            <div class="skills-stack reveal" style="max-width:960px;margin:2rem auto 0 auto;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));">
              ${skillsHtml}
            </div>
          </div>
        </section>
      `;
    }

    case 'experience': {
      const c = (block.content || {}) as any;
      const entriesHtml = (c.entries || c.jobs || [])
        .map(
          (e: any) => `
        <div class="exp-card reveal">
          <div class="exp-top">
            <div>
              <div class="exp-role">${escapeHtml(e.role)}</div>
              <div class="exp-company">${escapeHtml(e.company)}</div>
            </div>
            <div class="exp-date">${escapeHtml(e.dateRange || e.period)}</div>
          </div>
          <p class="about-body" style="margin-bottom:14px">${escapeHtml(e.summary || e.description || '')}</p>
          <ul class="exp-points">
            ${(e.points || e.achievements || []).map((pt: string) => `<li>${escapeHtml(pt)}</li>`).join('')}
          </ul>
        </div>
      `
        )
        .join('');

      return `
        <section id="experience" class="section">
          <div class="section-glow"></div>
          <div class="section-inner">
            <div class="sec-label reveal"><span class="sec-label-num">${escapeHtml(
              c.sectionNum || '02'
            )}</span><span class="sec-label-line"></span>${escapeHtml(c.sectionTitle || 'Experience')}</div>
            <h2 class="sec-title reveal">${escapeHtml(c.headline || 'On the job.')}</h2>
            ${entriesHtml}
          </div>
        </section>
      `;
    }

    case 'projects': {
      const c = (block.content || {}) as any;
      const projectsHtml = (c.projects || [])
        .map(
          (p: any) => `
        <div class="proj-card reveal">
          <div class="proj-card-bar"></div>
          <div class="proj-body">
            <div>
              <div class="proj-tag">${escapeHtml(p.tag || (p.tags && p.tags[0]) || 'Web')}</div>
              ${
                p.aiBadge
                  ? `<div class="ai-badge"><span class="ai-badge-dot"></span>${escapeHtml(p.aiBadge)}</div>`
                  : ''
              }
              ${
                p.platformBadge
                  ? `<div class="platform-badge pb-${escapeAttr(p.platformBadge.type || 'web')}">${escapeHtml(
                      p.platformBadge.text || ''
                    )}</div>`
                  : ''
              }
              <h3 class="proj-name">${escapeHtml(p.name || p.title)}</h3>
              <p class="proj-desc">${escapeHtml(p.description)}</p>
              <div class="proj-pills">
                ${(p.techPills || p.tags || []).map((pill: string) => `<span class="ppill">${escapeHtml(pill)}</span>`).join('')}
              </div>
              <ul class="proj-points">
                ${(p.points || []).map((pt: string) => `<li>${escapeHtml(pt)}</li>`).join('')}
              </ul>
            </div>
            <div class="proj-aside">
              <div class="proj-num-big">${escapeHtml(p.num || '01')}</div>
              ${
                p.liveUrl
                  ? `<a href="${sanitizeUrl(p.liveUrl)}" target="_blank" rel="noopener" class="proj-link-btn" title="Open Live Demo">&#x2197;</a>`
                  : ''
              }
              ${
                p.downloadUrl
                  ? `<a href="${sanitizeUrl(p.downloadUrl)}" class="proj-link-btn" title="Download">&#x2193;</a>`
                  : ''
              }
              ${p.downloadNote ? `<div class="dl-note">${escapeHtml(p.downloadNote)}</div>` : ''}
            </div>
          </div>
        </div>
      `
        )
        .join('');

      return `
        <section id="projects" class="section">
          <div class="section-glow sg1"></div>
          <div class="section-glow sg2"></div>
          <div class="section-inner">
            <div class="sec-label reveal"><span class="sec-label-num">${escapeHtml(
              c.sectionNum || '03'
            )}</span><span class="sec-label-line"></span>${escapeHtml(c.sectionTitle || 'Projects')}</div>
            <h2 class="sec-title reveal">${escapeHtml(c.headline || "Stuff I've shipped.")}</h2>
            <div class="proj-grid">${projectsHtml}</div>
          </div>
        </section>
      `;
    }

    case 'education': {
      const c = (block.content || {}) as any;
      const rowsHtml = (c.entries || c.items || [])
        .map(
          (e: any) => `
        <div class="edu-row reveal">
          <div class="edu-year">${escapeHtml(e.year || e.period)}</div>
          <div>
            <div class="edu-degree">${escapeHtml(e.degree)}</div>
            <div class="edu-school">${escapeHtml(e.school || e.institution)}</div>
            <div class="edu-score">${escapeHtml(e.score || '')}</div>
          </div>
        </div>
      `
        )
        .join('');

      return `
        <section id="education" class="section">
          <div class="section-glow"></div>
          <div class="section-inner">
            <div class="sec-label reveal"><span class="sec-label-num">${escapeHtml(
              c.sectionNum || '04'
            )}</span><span class="sec-label-line"></span>${escapeHtml(c.sectionTitle || 'Education')}</div>
            <h2 class="sec-title reveal">${escapeHtml(c.headline || 'Academic journey.')}</h2>
            <div class="edu-list">${rowsHtml}</div>
          </div>
        </section>
      `;
    }

    case 'highlights': {
      const c = (block.content || {}) as any;
      const cardsHtml = (c.highlights || [])
        .map(
          (h: any) => `
        <div class="hl-card reveal">
          <div class="hl-card-glow"></div>
          <span class="hl-icon">${escapeHtml(h.icon || '⚡')}</span>
          <div class="hl-title">${escapeHtml(h.title)}</div>
          <p class="hl-desc">${escapeHtml(h.description)}</p>
        </div>
      `
        )
        .join('');

      return `
        <section id="highlights" class="section">
          <div class="section-glow"></div>
          <div class="section-inner">
            <div class="sec-label reveal"><span class="sec-label-num">${escapeHtml(
              c.sectionNum || '05'
            )}</span><span class="sec-label-line"></span>${escapeHtml(c.sectionTitle || 'Highlights')}</div>
            <h2 class="sec-title reveal">${escapeHtml(c.headline || 'Beyond the code.')}</h2>
            <div class="hl-grid">${cardsHtml}</div>
          </div>
        </section>
      `;
    }

    case 'resume': {
      const c = (block.content || {}) as any;
      const highlightsHtml = (c.highlights || [])
        .map(
          (h: any) => `
        <div class="rh-item">
          <span class="rh-icon">${escapeHtml(h.icon || '💼')}</span>
          <div class="rh-text"><strong>${escapeHtml(h.label)}</strong> ${escapeHtml(h.details)}</div>
        </div>
      `
        )
        .join('');

      const previewImageUrl = sanitizeUrl(c.previewImageUrl, '/assets/resume-preview.png');
      const previewImageAlt = escapeAttr(c.previewImageAlt || 'Resume preview');
      let sideBody = (c.sideBody || '') as string;
      sideBody = sideBody.replace(/\s*or download a copy\.?/gi, '.');

      return `
        <section id="resume" class="section">
          <div class="section-glow"></div>
          <div class="section-inner">
            <div class="sec-label reveal"><span class="sec-label-num">${escapeHtml(
              c.sectionNum || '06'
            )}</span><span class="sec-label-line"></span>${escapeHtml(c.sectionTitle || 'Resume')}</div>
            <h2 class="sec-title reveal">${escapeHtml(c.headline || 'See it on paper.')}</h2>
            <div class="resume-layout">
              <div class="resume-frame reveal">
                <div class="resume-frame-bar">
                  <div class="resume-frame-dots"><span></span><span></span><span></span></div>
                  <div class="resume-frame-label">${escapeHtml(c.frameLabel || 'Resume_KGuna.pdf')}</div>
                  <div style="width:28px"></div>
                </div>
                <img src="${previewImageUrl}" alt="${previewImageAlt}" />
              </div>
              <div class="reveal d1">
                <div class="resume-side-title">${escapeHtml(c.sideTitle || '')}</div>
                <p class="resume-side-body">${escapeHtml(sideBody)}</p>
                <div class="resume-btns">
                  <a href="${previewImageUrl}" target="_blank" rel="noopener" class="btn-primary">${escapeHtml(
        c.openFullSizeLabel || 'View in Full Window'
      )}</a>
                </div>
                <div class="resume-highlights">${highlightsHtml}</div>
              </div>
            </div>
          </div>
        </section>
      `;
    }

    case 'contact': {
      const c = (block.content || {}) as any;
      const linksHtml = (c.contactLinks || [])
        .map(
          (l: any) => `
        <a href="${sanitizeUrl(l.href)}" class="clink" target="${
            l.type === 'linkedin' || l.href?.startsWith('http') ? '_blank' : '_self'
          }" rel="noopener">
          <span class="clink-icon">${escapeHtml(l.icon || '✉')}</span>
          <div class="clink-det">
            <div class="clink-lbl">${escapeHtml(l.label)}</div>
            <div class="clink-val">${escapeHtml(l.value)}</div>
          </div>
          <span class="clink-arr">&rarr;</span>
        </a>
      `
        )
        .join('');

      const cardsHtml = (c.infoCards || [])
        .map(
          (card: any) => `
        <div class="cc">
          <div class="cc-title">${escapeHtml(card.title)}</div>
          <p class="cc-body">${escapeHtml(card.body)}</p>
        </div>
      `
        )
        .join('');

      return `
        <section id="contact" class="section">
          <div class="section-glow sg1"></div>
          <div class="section-glow sg2"></div>
          <div class="contact-bg-text">${escapeHtml(c.bgWord || 'HELLO')}</div>
          <div class="section-inner">
            <div class="sec-label reveal"><span class="sec-label-num">${escapeHtml(
              c.sectionNum || '07'
            )}</span><span class="sec-label-line"></span>${escapeHtml(c.sectionTitle || 'Contact')}</div>
            <div class="contact-layout">
              <div class="reveal">
                <h2 class="contact-head">${escapeHtml(c.headline || "Let's build something.")}</h2>
                <p class="contact-sub">${escapeHtml(c.subtext || '')}</p>
                <div class="clinks">${linksHtml}</div>
              </div>
              <div class="contact-cards reveal d1">${cardsHtml}</div>
            </div>
          </div>
        </section>
      `;
    }

    case 'form': {
      const c = (block.content || {}) as any;
      const slug = escapeAttr(c.formSlug || 'contact-me');
      return `
        <section id="form-${slug}" class="section">
          <div class="section-inner">
            <div class="sec-label reveal"><span class="sec-label-num">${escapeHtml(
              c.sectionNum || '08'
            )}</span><span class="sec-label-line"></span>${escapeHtml(c.sectionTitle || 'Inquiry Form')}</div>
            <div class="cms-form-wrapper reveal" id="form-container-${slug}">
              <h3 style="font-family:var(--ff-display);font-size:32px;font-weight:700;margin-bottom:8px">${escapeHtml(
                c.headline || 'Send an inquiry directly.'
              )}</h3>
              <p style="font-size:13px;color:var(--text-soft);margin-bottom:28px">${escapeHtml(c.subtitle || '')}</p>
              <form class="cms-contact-form" data-form-slug="${slug}">
                <div class="cms-form-field">
                  <label class="cms-form-label">Your Name *</label>
                  <input type="text" name="name" required class="cms-form-input" placeholder="e.g. Alex Smith" />
                </div>
                <div class="cms-form-field">
                  <label class="cms-form-label">Email Address *</label>
                  <input type="email" name="email" required class="cms-form-input" placeholder="e.g. alex@company.com" />
                </div>
                <div class="cms-form-field">
                  <label class="cms-form-label">Phone Number</label>
                  <input type="tel" name="phone" class="cms-form-input" placeholder="+91 ..." />
                </div>
                <div class="cms-form-field">
                  <label class="cms-form-label">Message *</label>
                  <textarea name="message" rows="4" required class="cms-form-textarea" placeholder="Tell me about the role, project, or idea..."></textarea>
                </div>
                <button type="submit" class="btn-primary" style="border:none;cursor:pointer">${escapeHtml(
                  c.submitLabel || 'Send Message →'
                )}</button>
                <div class="cms-form-status" style="display:none;"></div>
              </form>
            </div>
          </div>
        </section>
      `;
    }

    case 'richText': {
      const c = (block.content || {}) as any;
      const cleanContent = sanitizeRichText(c.html || c.body || '');
      return `
        <section id="${escapeAttr(block.id || 'rich-text')}" class="section">
          <div class="section-glow"></div>
          <div class="section-inner">
            ${
              c.sectionTitle
                ? `<div class="sec-label reveal"><span class="sec-label-num">${escapeHtml(
                    c.sectionNum || ''
                  )}</span><span class="sec-label-line"></span>${escapeHtml(c.sectionTitle)}</div>`
                : ''
            }
            ${c.headline || c.title ? `<h2 class="sec-title reveal">${escapeHtml(c.headline || c.title)}</h2>` : ''}
            <div class="reveal" style="color:var(--text);font-size:15px;line-height:1.7;margin-top:1.5rem;">
              ${cleanContent}
            </div>
          </div>
        </section>
      `;
    }

    case 'gallery': {
      const c = (block.content || {}) as any;
      const items = c.items || c.images || [];
      const galleryHtml = items
        .map(
          (item: any, idx: number) => `
        <div class="proj-card reveal" style="padding:0;overflow:hidden;">
          <div style="aspect-ratio:16/10;background:var(--surface);overflow:hidden;">
            <img src="${sanitizeUrl(item.imageUrl || item.url, '')}" alt="${escapeAttr(
            item.alt || item.caption || `Gallery item ${idx + 1}`
          )}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
          </div>
          ${
            item.caption
              ? `<div style="padding:12px 16px;font-size:13px;color:var(--text-soft);border-top:1px solid var(--border);">${escapeHtml(
                  item.caption
                )}</div>`
              : ''
          }
        </div>
      `
        )
        .join('');

      return `
        <section id="gallery" class="section">
          <div class="section-glow"></div>
          <div class="section-inner">
            <div class="sec-label reveal"><span class="sec-label-num">${escapeHtml(
              c.sectionNum || '09'
            )}</span><span class="sec-label-line"></span>${escapeHtml(c.sectionTitle || 'Gallery')}</div>
            <h2 class="sec-title reveal">${escapeHtml(c.headline || 'Visual Highlights')}</h2>
            <div class="proj-grid reveal" style="margin-top:2rem;">
              ${galleryHtml}
            </div>
          </div>
        </section>
      `;
    }

    default:
      return '';
  }
}
