export interface CmsBlock {
  id?: string;
  type: string;
  order?: number;
  isVisible?: boolean;
  content: any;
  customCss?: string;
}
import { escapeHtml, escapeAttr, sanitizeUrl, sanitizeRichText } from './sanitize.js';

export const SVG_WEB = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="proj-btn-icon proj-btn-icon-web" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;

export const SVG_PLAY = `<svg viewBox="0 0 24 24" fill="currentColor" class="proj-btn-icon proj-btn-icon-play" aria-hidden="true"><path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"/></svg>`;

export const SVG_DOWNLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="proj-btn-icon proj-btn-icon-dl" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

export const SVG_GITHUB = `<svg viewBox="0 0 24 24" fill="currentColor" class="proj-btn-icon proj-btn-icon-gh" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`;

export function renderProjectActionButtons(p: any): string {
  const buttons: string[] = [];
  const isPlayUrl = (url?: string) => Boolean(url && (url.includes('play.google.com') || url.includes('market://')));
  const isPlayNote = (note?: string) => Boolean(note && /google\s*play|play\s*store/i.test(note));

  let playStoreHref: string | null = null;
  if (p.playStoreUrl) {
    playStoreHref = p.playStoreUrl;
  } else if (isPlayUrl(p.downloadUrl) || (p.downloadUrl && isPlayNote(p.downloadNote))) {
    playStoreHref = p.downloadUrl;
  } else if (isPlayUrl(p.liveUrl)) {
    playStoreHref = p.liveUrl;
  }

  let webHref: string | null = null;
  if (p.liveUrl && p.liveUrl !== playStoreHref && !isPlayUrl(p.liveUrl)) {
    webHref = p.liveUrl;
  }

  let dlHref: string | null = null;
  if (p.downloadUrl && p.downloadUrl !== playStoreHref) {
    dlHref = p.downloadUrl;
  }

  const ghHref = p.sourceUrl || p.githubUrl || null;

  if (webHref) {
    buttons.push(
      `<a href="${sanitizeUrl(webHref)}" target="_blank" rel="noopener" class="proj-link-btn btn-web" title="Open Web App / Live Demo" aria-label="Open Web App">${SVG_WEB}</a>`
    );
  }

  if (playStoreHref) {
    buttons.push(
      `<a href="${sanitizeUrl(playStoreHref)}" target="_blank" rel="noopener" class="proj-link-btn btn-playstore" title="Get it on Google Play" aria-label="Get it on Google Play">${SVG_PLAY}</a>`
    );
  }

  if (dlHref) {
    buttons.push(
      `<a href="${sanitizeUrl(dlHref)}" target="_blank" rel="noopener" class="proj-link-btn btn-download" title="Download Application" aria-label="Download Application">${SVG_DOWNLOAD}</a>`
    );
  }

  if (ghHref && ghHref !== webHref) {
    buttons.push(
      `<a href="${sanitizeUrl(ghHref)}" target="_blank" rel="noopener" class="proj-link-btn btn-github" title="View Source on GitHub" aria-label="View Source on GitHub">${SVG_GITHUB}</a>`
    );
  }

  return buttons.join('');
}

export function renderBlock(block: CmsBlock): string {
  if (!block || !block.isVisible) return '';

  switch (block.type) {
    case 'hero': {
      const c = (block.content || {}) as any;
      const tagsHtml = (c.floatingTags || [])
        .map((t: string, i: number) => `<div class="float-tag ft${(i % 5) + 1} notranslate" translate="no">${escapeHtml(t)}</div>`)
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

      const photoUrl = sanitizeUrl(c.photoUrl, '/assets/WhatsApp Image 2026-10-25 at 13.20.31.jpeg');
      const photoAlt = escapeAttr(c.photoAlt || 'Hero portrait');

      // Status Pill / Announcement Banner
      const isPillVisible = c.pillVisible !== false && c.showPill !== false && Boolean(c.pillText && String(c.pillText).trim());
      let pillHtml = '';

      if (isPillVisible) {
        const isAnnouncement = Boolean(c.pillIsAnnouncement);
        let isExpired = false;
        let expiresAtIso = '';

        if (isAnnouncement && c.pillAnnouncementExpiresAt) {
          try {
            const exp = new Date(c.pillAnnouncementExpiresAt);
            if (!isNaN(exp.getTime())) {
              expiresAtIso = exp.toISOString();
              if (exp.getTime() <= Date.now()) {
                isExpired = true;
              }
            }
          } catch {
            // ignore date error
          }
        }

        const expiryAction = c.pillAnnouncementExpiryAction || 'hide';

        if (isAnnouncement && isExpired && expiryAction === 'hide') {
          pillHtml = '';
        } else {
          const treatAsAnnouncement = isAnnouncement && !isExpired;
          const announcementStyle = c.pillAnnouncementStyle || 'amber';
          const announcementTag = c.pillAnnouncementTag || 'ANNOUNCEMENT';
          const rawText = String(c.pillText || '').trim();
          const pillText = escapeHtml(rawText);
          const pillLink = c.pillLink ? sanitizeUrl(c.pillLink) : '';

          const pillClasses = [
            'hero-pill',
            treatAsAnnouncement ? 'hero-pill-announcement' : '',
            treatAsAnnouncement ? `announcement-style-${announcementStyle}` : '',
            pillLink ? 'hero-pill-link' : '',
          ].filter(Boolean).join(' ');

          const tagHtml = treatAsAnnouncement && announcementTag
            ? `<span class="pill-announcement-tag"><span class="pill-announcement-icon" aria-hidden="true">📢</span>${escapeHtml(announcementTag)}</span>`
            : '';

          const pulseHtml = `<span class="pulse"></span>`;
          const contentInner = `${pulseHtml}${tagHtml}<span class="pill-label-text">${pillText}</span>`;
          const expiryDataAttr = expiresAtIso ? ` data-expires-at="${escapeAttr(expiresAtIso)}"` : '';
          const actionDataAttr = expiresAtIso ? ` data-expiry-action="${escapeAttr(expiryAction)}"` : '';

          if (pillLink) {
            const isExternal = pillLink.startsWith('http://') || pillLink.startsWith('https://');
            pillHtml = `<a href="${pillLink}" class="${pillClasses}"${expiryDataAttr}${actionDataAttr}${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}>${contentInner}</a>`;
          } else {
            pillHtml = `<div class="${pillClasses}"${expiryDataAttr}${actionDataAttr}>${contentInner}</div>`;
          }
        }
      }

      return `
        <section id="hero">
          <div class="orb1 hero-orb"></div>
          <div class="orb2 hero-orb"></div>
          <div class="orb3 hero-orb"></div>
          <div class="bg-grid"></div>
          ${tagsHtml}
          <div class="hero-inner">
            <div class="hero-text">
              ${pillHtml}
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
            ${(g.tags || []).map((t: string) => `<span class="sb-tag notranslate" translate="no">${escapeHtml(t)}</span>`).join('')}
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
                  ? `<div class="platform-badge pb-${escapeAttr(p.platformBadge.type || 'web')}"><span class="platform-badge-dot"></span>${escapeHtml(
                      p.platformBadge.text || ''
                    )}</div>`
                  : ''
              }
              <h3 class="proj-name">${escapeHtml(p.name || p.title)}</h3>
              <p class="proj-desc">${escapeHtml(p.description)}</p>
              <div class="proj-pills">
                ${(p.techPills || p.tags || []).map((pill: string) => `<span class="ppill notranslate" translate="no">${escapeHtml(pill)}</span>`).join('')}
              </div>
              <ul class="proj-points">
                ${(p.points || []).map((pt: string) => `<li>${escapeHtml(pt)}</li>`).join('')}
              </ul>
            </div>
            <div class="proj-aside">
              <div class="proj-aside-head">
                ${
                  (p.appIcon || p.iconUrl)
                    ? `<div class="proj-icon-wrap"><img src="${sanitizeUrl(p.appIcon || p.iconUrl)}" alt="${escapeAttr(p.name || p.title || 'App')} icon" class="proj-app-icon" loading="lazy" /></div>`
                    : ''
                }
                <div class="proj-num-big">${escapeHtml(p.num || '01')}</div>
              </div>
              <div class="proj-aside-actions">
                ${renderProjectActionButtons(p)}
              </div>
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
