import { renderBlock } from './renderers.js';
import { BASELINE_BLOCKS } from './baseline-blocks.js';
import { escapeHtml, escapeAttr, sanitizeUrl } from './sanitize.js';
import { initVisitorAnalytics } from './analytics.js';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://api.gunasai.in')
).replace(/\/$/, '');

export function resolveApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
}

// ----------------------------------------------------------------------------
// LIVE SYNC & PROFILE HIGHLIGHTS TICKER CONTROLLER
// Simple, non-intrusive pill matching .hero-pill aesthetic
// Cycles through engaging profile achievements while server spins up
// ----------------------------------------------------------------------------
// LIVE SYNC & PROFILE HIGHLIGHTS TICKER CONTROLLER
// Simple, non-intrusive pill matching .hero-pill aesthetic
// Cycles through engaging profile achievements while server spins up
// ----------------------------------------------------------------------------
const PROFILE_FACTS: string[] = [
  '● CONNECTING LIVE CMS (RENDER COLD BOOT)...',
  'FULL STACK DEVELOPER INTERN @ ZENITHINDIA',
  '100+ LEETCODE DSA PROBLEMS SOLVED IN C++',
  'AI BUILDER · PINECONE RAG + GROQ LLM PIPELINES',
  'BUNK360 · OFFLINE ANDROID ERP WITH SQLITE',
  'WINEERP · DESKTOP POS WITH RSA-2048 LICENSING',
  'B.TECH MECHANICAL @ NIT DELHI · 8.04 CGPA',
];

let tickerInterval: any = null;
let tickerFactIndex = 0;

function rotateTickerFact() {
  const tickerText = document.getElementById('ticker-text');
  if (!tickerText) return;
  tickerFactIndex = (tickerFactIndex + 1) % PROFILE_FACTS.length;
  tickerText.classList.add('ticker-swapping');
  setTimeout(() => {
    tickerText.textContent = PROFILE_FACTS[tickerFactIndex];
    tickerText.classList.remove('ticker-swapping');
  }, 220);
}

function startSyncHud(_routeLabel: string = 'home') {
  const ticker = document.getElementById('portfolio-live-ticker');
  const topLoader = document.getElementById('cyber-top-loader');
  const tickerText = document.getElementById('ticker-text');

  if (topLoader) {
    topLoader.classList.remove('done');
    topLoader.classList.add('active');
  }

  if (ticker) {
    ticker.style.display = 'inline-flex';
    ticker.classList.remove('synced', 'fade-out');
    tickerFactIndex = 0;
    if (tickerText) {
      tickerText.textContent = PROFILE_FACTS[0];
    }
  }

  if (tickerInterval) clearInterval(tickerInterval);
  tickerInterval = setInterval(rotateTickerFact, 3200);
}

function markSyncSuccess(mode: 'live' | 'cache' = 'live') {
  if (tickerInterval) {
    clearInterval(tickerInterval);
    tickerInterval = null;
  }

  const ticker = document.getElementById('portfolio-live-ticker');
  const topLoader = document.getElementById('cyber-top-loader');
  const tickerText = document.getElementById('ticker-text');

  if (topLoader) {
    topLoader.classList.add('done');
    setTimeout(() => {
      topLoader.classList.remove('active');
    }, 450);
  }

  if (ticker) {
    ticker.classList.add('synced');
    if (tickerText) {
      tickerText.textContent = mode === 'live' ? '✓ LIVE CMS CONNECTED' : '✓ PORTFOLIO READY';
    }

    // Auto-fade after 2.5s to keep UI clean and unobtrusive
    setTimeout(() => {
      if (ticker) {
        ticker.classList.add('fade-out');
        setTimeout(() => {
          ticker.style.display = 'none';
        }, 600);
      }
    }, 2500);
  }
}

// ----------------------------------------------------------------------------
// FULL-SCREEN APP PRELOADER CONTROLLER
// Seamless boot sequence: telemetry progress, rotating highlights, graceful fade-out
// ----------------------------------------------------------------------------
class AppPreloader {
  private el: HTMLElement | null;
  private barEl: HTMLElement | null;
  private logEl: HTMLElement | null;
  private pctEl: HTMLElement | null;
  private pillTextEl: HTMLElement | null;
  private statusTitleEl: HTMLElement | null;
  private timer: any = null;
  private factTimer: any = null;
  private fallbackTimer: any = null;
  private isDone = false;

  constructor() {
    this.el = document.getElementById('app-preloader');
    this.barEl = document.getElementById('preloader-progress-bar');
    this.logEl = document.getElementById('preloader-log-text');
    this.pctEl = document.getElementById('preloader-pct-text');
    this.pillTextEl = document.getElementById('preloader-highlight-text');
    this.statusTitleEl = document.getElementById('preloader-status-title');
    this.startProgress();

    // Safety fallback: Never trap user on preloader longer than 3.5s
    this.fallbackTimer = setTimeout(() => {
      this.complete();
    }, 3500);
  }

  private startProgress() {
    if (!this.el) return;
    this.updateUI(25, 'Booting portfolio runtime...');

    let step = 0;
    const steps = [
      { pct: 45, log: 'Loading design tokens & fonts...' },
      { pct: 68, log: 'Mounting baseline portfolio blocks...' },
      { pct: 85, log: 'Synchronizing interactive animations...' },
      { pct: 94, log: 'Linking live cloud CMS database...' },
    ];

    this.timer = setInterval(() => {
      if (this.isDone) return;
      if (step < steps.length) {
        this.updateUI(steps[step].pct, steps[step].log);
        step++;
      }
    }, 120);

    let factIdx = 0;
    this.factTimer = setInterval(() => {
      if (this.isDone) return;
      factIdx = (factIdx + 1) % PROFILE_FACTS.length;
      if (this.pillTextEl) {
        this.pillTextEl.textContent = PROFILE_FACTS[factIdx];
      }
    }, 1600);
  }

  public updateUI(pct: number, log?: string) {
    const val = Math.min(pct, 100);
    if (this.barEl) this.barEl.style.width = `${val}%`;
    if (this.pctEl) this.pctEl.textContent = `${val}%`;
    if (log && this.logEl) this.logEl.textContent = log;
  }

  public complete(callback?: () => void) {
    if (this.isDone) return;
    this.isDone = true;
    if (this.timer) clearInterval(this.timer);
    if (this.factTimer) clearInterval(this.factTimer);
    if (this.fallbackTimer) clearTimeout(this.fallbackTimer);

    this.updateUI(100, 'System ready · Welcome');
    if (this.statusTitleEl) {
      this.statusTitleEl.textContent = 'SYSTEM READY';
    }

    const footer = document.querySelector('footer');
    if (footer) footer.classList.add('ready');

    setTimeout(() => {
      if (this.el) {
        this.el.classList.add('preloader-dismissed');
        setTimeout(() => {
          if (this.el) this.el.style.display = 'none';
          if (callback) callback();
        }, 650);
      }
    }, 320);
  }
}

function renderCyberPageLoader(slug: string): string {
  return `
    <div class="cyber-page-loader">
      <div class="cpl-stage">
        <div class="cpl-ring-1"></div>
        <div class="cpl-brand">GS<span>.</span></div>
      </div>
      <div class="cpl-hud-box">
        <div class="cpl-title">
          <span class="ticker-pulse-dot"></span>
          INITIALIZING /${escapeHtml(slug)}
        </div>
        <p class="cpl-desc">
          Spinning up live cloud CMS container. Displaying baseline portfolio...
        </p>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 1. DYNAMIC CONTENT HYDRATION WITH RESILIENT RETRY
// ----------------------------------------------------------------------------
async function hydratePortfolio() {
  const preloader = new AppPreloader();

  const urlParams = new URLSearchParams(window.location.search);
  let previewToken = urlParams.get('token');
  const previewParam = urlParams.get('preview');
  if (!previewToken && previewParam && previewParam !== 'true') {
    previewToken = previewParam;
  }
  const isPreview = Boolean(previewToken || previewParam === 'true');

  // Extract route slug from path
  const pathParts = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/');
  const rawSlug = pathParts[0] && pathParts[0] !== 'index.html' ? pathParts[0] : 'home';
  const slug = decodeURIComponent(rawSlug);

  let pageApiUrl = `/api/v1/public/pages/${encodeURIComponent(slug)}`;
  if (isPreview && previewToken) {
    pageApiUrl = `/api/v1/public/pages/${encodeURIComponent(slug)}?preview=true&token=${encodeURIComponent(previewToken)}`;
    const banner = document.getElementById('cms-preview-banner');
    if (banner) banner.style.display = 'flex';
  }

  const root = document.getElementById('cms-sections-root');

  // Check if real section elements exist (safely ignores comments or whitespace)
  const hasSections = root && root.querySelectorAll('section, .section, #hero').length > 0;

  // 1. If home route, immediately render complete static baseline so user gets 0ms instant content
  if (slug === 'home') {
    if (root && !hasSections) {
      root.innerHTML = BASELINE_BLOCKS.map((sec) => renderBlock(sec)).join('');
      bindFormSubmissions();
      setupInteractiveBehaviors();
    }
    // Dismiss preloader smoothly after baseline is rendered
    setTimeout(() => {
      preloader.complete();
    }, 450);
  } else {
    // If custom subpage route, show authentic cyber loading graphic while waiting
    if (root) {
      root.innerHTML = renderCyberPageLoader(slug);
    }
  }

  // Start top progress shimmer and Live Sync HUD
  startSyncHud(slug);

  // 2. Fetch site settings & page data with auto-retry during container spin-up
  let attempts = 0;
  const maxAttempts = 15; // 15 attempts * 3s = 45s window for cold boots
  let connected = false;

  while (attempts < maxAttempts && !connected) {
    attempts++;
    try {
      // Fetch site settings and page data in parallel
      const [siteRes, pageRes] = await Promise.all([
        fetch(resolveApiUrl('/api/v1/public/site')),
        fetch(resolveApiUrl(pageApiUrl)),
      ]);

      if (siteRes.ok) {
        const siteJson = await siteRes.json();
        if (siteJson.success && siteJson.data) {
          applySiteSettings(siteJson.data);
        }
      }

      if (pageRes.ok) {
        const pageJson = await pageRes.json();
        if (pageJson.success && pageJson.data?.sections) {
          if (root) {
            root.innerHTML = pageJson.data.sections.map((sec: any) => renderBlock(sec)).join('');
            if (isPreview) {
              const badge = document.getElementById('preview-rev-badge');
              if (badge) badge.textContent = `#${pageJson.data.revision || 'DRAFT'}`;
            }
            bindFormSubmissions();
            setupInteractiveBehaviors();
          }
          preloader.complete();
          markSyncSuccess('live');
          connected = true;
          return;
        }
      } else if (pageRes.status === 404 && slug !== 'home') {
        // Page explicitly not found
        if (root) {
          root.innerHTML = `
            <div class="cyber-page-loader">
              <div class="cpl-hud-box" style="border-color:var(--rose)">
                <div class="cpl-title" style="color:var(--rose)">404 · PAGE NOT FOUND</div>
                <p class="cpl-desc">The requested page route <code>/${escapeHtml(slug)}</code> does not exist.</p>
                <div style="margin-top:20px">
                  <a href="/" class="btn-primary" style="display:inline-block">Return to Home &rarr;</a>
                </div>
              </div>
            </div>
          `;
        }
        preloader.complete();
        markSyncSuccess('live');
        return;
      }
    } catch (err) {
      console.warn(`[CMS Hydration] Attempt #${attempts} waiting for server to spin up:`, err);
    }

    if (!connected && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // If after retries the server could not be reached, ensure baseline is intact
  if (!connected) {
    if (slug === 'home' && root && root.querySelectorAll('section, .section, #hero').length === 0) {
      root.innerHTML = BASELINE_BLOCKS.map((sec) => renderBlock(sec)).join('');
      bindFormSubmissions();
      setupInteractiveBehaviors();
    }
    preloader.complete();
    markSyncSuccess('cache');
  }
}

function applySiteSettings(site: any) {
  if (!site) return;

  if (site.title) {
    document.title = site.title;
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = site.title;
  }
  if (site.metaDescription) {
    const descEl = document.getElementById('meta-desc');
    if (descEl) descEl.setAttribute('content', site.metaDescription);
  }

  // Navigation Bar & Mobile Menu
  if (site.nav) {
    const logoEl = document.getElementById('nav-logo-text');
    if (logoEl && site.nav.logoText) logoEl.textContent = site.nav.logoText;
    const dotEl = document.getElementById('nav-logo-dot');
    if (dotEl && site.nav.logoDot) dotEl.textContent = site.nav.logoDot;

    const navLinksList = document.getElementById('nav-links-list');
    const mobMenu = document.getElementById('mobMenu');

    if (site.nav.links && Array.isArray(site.nav.links)) {
      const linksHtml = site.nav.links
        .map((l: any) => `<li><a href="${l.href ? sanitizeUrl(l.href) : '#'}">${escapeHtml(l.label)}</a></li>`)
        .join('');
      const ctaHtml =
        site.nav.hireMeCta?.enabled !== false
          ? `<li><a href="${site.nav.hireMeCta?.href ? sanitizeUrl(site.nav.hireMeCta.href) : '#'}" class="nav-cta" id="nav-cta-btn">${escapeHtml(
              site.nav.hireMeCta?.label || 'Hire Me ↗'
            )}</a></li>`
          : '';

      if (navLinksList) {
        navLinksList.innerHTML = linksHtml + ctaHtml;
      }

      // Dynamic Mobile Drawer
      if (mobMenu) {
        const mobLinksHtml = site.nav.links
          .map(
            (l: any) =>
              `<a href="${l.href ? sanitizeUrl(l.href) : '#'}" onclick="closeMob()">${escapeHtml(l.label)}</a>`
          )
          .join('');
        const mobCtaHtml =
          site.nav.hireMeCta?.enabled !== false
            ? `<a href="${site.nav.hireMeCta?.href ? sanitizeUrl(site.nav.hireMeCta.href) : '#'}" onclick="closeMob()" style="color:var(--amber)">${escapeHtml(
                site.nav.hireMeCta?.label || 'Hire Me ↗'
              )}</a>`
            : '';
        const mobMechHtml =
          site.nav.mechToggle?.enabled !== false
            ? `<a href="${site.nav.mechToggle?.href ? sanitizeUrl(site.nav.mechToggle.href) : '#'}" target="_blank" rel="noopener" style="color:var(--violet);font-size:15px;font-family:var(--ff-mono);letter-spacing:0.1em;text-transform:uppercase;border:1px solid rgba(124,92,252,0.35);padding:10px 22px;border-radius:100px">&#9881; ${escapeHtml(
                site.nav.mechToggle?.label || 'Mech Portfolio'
              )}</a>`
            : '';

        mobMenu.innerHTML = `<button class="mob-close" id="mobClose" type="button" aria-label="Close menu">&times;</button>${mobLinksHtml}${mobCtaHtml}${mobMechHtml}`;
      }
    }

    // Mech Portfolio Toggle
    const mechBtn = document.getElementById('mech-toggle-btn');
    const mechLabel = document.getElementById('mech-toggle-label');
    if (site.nav.mechToggle) {
      if (site.nav.mechToggle.enabled === false) {
        if (mechBtn) mechBtn.style.display = 'none';
      } else {
        if (mechBtn) {
          mechBtn.style.display = 'flex';
          mechBtn.setAttribute('href', site.nav.mechToggle.href ? sanitizeUrl(site.nav.mechToggle.href) : '#');
        }
        if (mechLabel && site.nav.mechToggle.label) {
          mechLabel.textContent = site.nav.mechToggle.label;
        }
      }
    }
  }

  // Footer Dynamic Text
  if (site.footer) {
    const leftTextEl = document.getElementById('footer-left-text');
    if (leftTextEl && site.footer.leftText) leftTextEl.textContent = site.footer.leftText;
    const authorEl = document.getElementById('footer-author');
    if (authorEl && site.footer.leftHighlight) authorEl.textContent = site.footer.leftHighlight;
    const yearEl = document.getElementById('footer-year');
    if (yearEl && site.footer.year) yearEl.textContent = site.footer.year;
    const rightEl = document.getElementById('footer-right-text');
    if (rightEl && site.footer.rightText) rightEl.textContent = site.footer.rightText;
  }
}

function renderFallbackSections() {
  const root = document.getElementById('cms-sections-root');
  if (!root) return;
  root.innerHTML = BASELINE_BLOCKS.map((sec) => renderBlock(sec)).join('');
}

function bindFormSubmissions() {
  document.querySelectorAll<HTMLFormElement>('.cms-contact-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const slug = form.getAttribute('data-form-slug') || 'contact-me';
      const statusBox = form.querySelector('.cms-form-status') as HTMLElement;
      const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      const formData = new FormData(form);
      const data: Record<string, any> = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      if (submitBtn) submitBtn.disabled = true;
      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.className = 'cms-form-msg';
        statusBox.textContent = 'Sending message...';
      }

      try {
        const res = await fetch(resolveApiUrl(`/api/v1/public/forms/${slug}/submissions`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          form.reset();
          if (statusBox) {
            statusBox.className = 'cms-form-msg cms-form-success';
            statusBox.textContent = json.message || 'Thank you! Your message has been sent successfully.';
          }
        } else {
          if (statusBox) {
            statusBox.className = 'cms-form-msg cms-form-error';
            statusBox.textContent = json.error?.message || 'Failed to submit form. Please try again.';
          }
        }
      } catch (err: any) {
        if (statusBox) {
          statusBox.className = 'cms-form-msg cms-form-error';
          statusBox.textContent = 'Network error. Please try again later.';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

// ----------------------------------------------------------------------------
// 2. PRESERVED INTERACTIVE ANIMATIONS (CANVAS, DUAL CURSOR, STICKY NAV)
// ----------------------------------------------------------------------------
function setupInteractiveBehaviors() {
  // Canvas animation
  const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      let W = (canvas.width = window.innerWidth);
      let H = (canvas.height = window.innerHeight);
      const mouse = { x: -999, y: -999 };

      const resize = () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', resize);
      window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      });

      class Particle {
        x = 0;
        y = 0;
        r = 0;
        vx = 0;
        vy = 0;
        life = 0;
        decay = 0;
        color = '';

        constructor() {
          this.reset();
        }
        reset() {
          this.x = Math.random() * W;
          this.y = Math.random() * H;
          this.r = Math.random() * 1.5 + 0.3;
          this.vx = (Math.random() - 0.5) * 0.3;
          this.vy = (Math.random() - 0.5) * 0.3;
          this.life = Math.random() * 0.5 + 0.5;
          this.decay = Math.random() * 0.002 + 0.001;
          const c = Math.random();
          this.color = c > 0.6 ? '255,200,74' : c > 0.3 ? '124,92,252' : '0,212,180';
        }
        update() {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            this.vx -= (dx / d) * 0.06;
            this.vy -= (dy / d) * 0.06;
          }
          this.vx *= 0.98;
          this.vy *= 0.98;
          this.x += this.vx;
          this.y += this.vy;
          this.life -= this.decay;
          if (this.life <= 0 || this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
        }
        draw() {
          if (!ctx) return;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${this.color},${this.life * 0.7})`;
          ctx.fill();
        }
      }

      const particles = Array.from({ length: 90 }, () => new Particle());

      function drawLines() {
        if (!ctx) return;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 100) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(255,200,74,${(1 - d / 100) * 0.08})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      function animate() {
        if (!ctx) return;
        ctx.clearRect(0, 0, W, H);
        drawLines();
        particles.forEach((p) => {
          p.update();
          p.draw();
        });
        requestAnimationFrame(animate);
      }
      animate();
    }
  }

  // Sticky navbar
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => nav.classList.toggle('stuck', window.scrollY > 60), { passive: true });
  }


  // Scroll reveals
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('vis');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.08 }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Parallax glow orbs
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      const o1 = document.querySelector('.orb1') as HTMLElement;
      const o2 = document.querySelector('.orb2') as HTMLElement;
      if (o1) o1.style.transform = `translate(${y * 0.04}px,${y * 0.06}px)`;
      if (o2) o2.style.transform = `translate(${-y * 0.03}px,${-y * 0.05}px)`;
    },
    { passive: true }
  );
}

// ----------------------------------------------------------------------------
// 3. MULTILINGUAL GOOGLE TRANSLATE SWITCHER
// ----------------------------------------------------------------------------
const LANGS = [
  { code: 'en', label: 'EN', name: 'English', native: 'English' },
  { code: 'hi', label: 'HI', name: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'TE', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'TA', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', label: 'KN', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'ML', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn', label: 'BN', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'MR', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'GU', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa', label: 'PA', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur', label: 'UR', name: 'Urdu', native: 'اردو' },
  { code: 'es', label: 'ES', name: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'FR', name: 'French', native: 'Français' },
  { code: 'de', label: 'DE', name: 'German', native: 'Deutsch' },
  { code: 'pt', label: 'PT', name: 'Portuguese', native: 'Português' },
  { code: 'it', label: 'IT', name: 'Italian', native: 'Italiano' },
  { code: 'ru', label: 'RU', name: 'Russian', native: 'Русский' },
  { code: 'zh-CN', label: 'ZH', name: 'Chinese', native: '中文' },
  { code: 'ja', label: 'JA', name: 'Japanese', native: '日本語' },
  { code: 'ko', label: 'KO', name: 'Korean', native: '한국어' },
  { code: 'ar', label: 'AR', name: 'Arabic', native: 'العربية' },
];

function getCookie(name: string): string {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? decodeURIComponent(m.pop()!) : '';
}

function clearGoogTransCookie() {
  const host = window.location.hostname;
  const domainParts = host.split('.');
  const domains: string[] = ['', host, '.' + host];

  if (domainParts.length >= 2) {
    const rootDomain = domainParts.slice(-2).join('.');
    domains.push(rootDomain);
    domains.push('.' + rootDomain);
  }

  const paths = ['/', '', window.location.pathname];

  domains.forEach((d) => {
    paths.forEach((p) => {
      const dAttr = d ? `domain=${d};` : '';
      const pAttr = p ? `path=${p};` : '';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${pAttr} ${dAttr}`;
      document.cookie = `googtrans=; max-age=0; ${pAttr} ${dAttr}`;
    });
  });

  try {
    sessionStorage.removeItem('googtrans');
    localStorage.removeItem('googtrans');
  } catch (_) {}

  if (window.location.hash && window.location.hash.includes('googtrans')) {
    history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }
}

function setGoogTransCookie(langCode: string) {
  if (langCode === 'en') {
    clearGoogTransCookie();
    return;
  }
  const val = '/en/' + langCode;
  const host = window.location.hostname;
  const domainParts = host.split('.');

  document.cookie = `googtrans=${val};path=/;`;
  document.cookie = `googtrans=${val};path=/;domain=${host};`;
  if (domainParts.length >= 2) {
    const rootDomain = domainParts.slice(-2).join('.');
    document.cookie = `googtrans=${val};path=/;domain=.${rootDomain};`;
  }
}

function currentLangFromCookie(): string {
  const c = getCookie('googtrans');
  if (!c) return 'en';
  const parts = c.split('/').filter(Boolean);
  const target = parts[1] || 'en';
  if (target === 'en') {
    clearGoogTransCookie();
    return 'en';
  }
  return target;
}

function initLanguageSwitcher() {
  const langBtn = document.getElementById('langBtn');
  const langBtnLabel = document.getElementById('langBtnLabel');
  const langDropdown = document.getElementById('langDropdown');
  const langSwitch = document.getElementById('langSwitch');

  if (!langBtn || !langBtnLabel || !langDropdown || !langSwitch) return;

  // Auto-heal legacy or malformed /en/en cookies from previous sessions
  const rawCookie = getCookie('googtrans');
  if (rawCookie && (rawCookie.includes('/en/en') || rawCookie === '/en' || rawCookie.endsWith('/en'))) {
    clearGoogTransCookie();
  }

  function buildDropdown(activeCode: string) {
    if (!langDropdown) return;
    langDropdown.innerHTML = '';
    LANGS.forEach((l) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-opt notranslate' + (l.code === activeCode ? ' active' : '');
      btn.setAttribute('role', 'option');
      btn.setAttribute('translate', 'no');
      btn.setAttribute('aria-selected', l.code === activeCode ? 'true' : 'false');
      btn.innerHTML = `<span class="notranslate" translate="no">${l.name}</span><span class="lo-native notranslate" translate="no">${l.native}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectLanguage(l.code);
      });
      langDropdown.appendChild(btn);
    });
  }

  function triggerGoogleCombo(code: string, retries = 40): boolean | null {
    const combo = document.querySelector('select.goog-te-combo') as HTMLSelectElement | null;
    if (!combo) {
      if (retries <= 0) return false;
      setTimeout(() => triggerGoogleCombo(code, retries - 1), 150);
      return null;
    }
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(combo, code);
    } else {
      combo.value = code;
    }
    combo.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function selectLanguage(code: string) {
    langSwitch?.classList.remove('open');
    langBtn?.setAttribute('aria-expanded', 'false');

    const current = currentLangFromCookie();
    if (code === current) return;

    if (code === 'en') {
      clearGoogTransCookie();
      if (langBtnLabel) langBtnLabel.textContent = 'EN';
      buildDropdown('en');
      // Clean reload to instantly restore original pristine English DOM
      window.location.reload();
      return;
    }

    const found = LANGS.find((l) => l.code === code) || LANGS[0];
    if (langBtnLabel) langBtnLabel.textContent = found.label;
    buildDropdown(code);
    setGoogTransCookie(code);

    const applied = triggerGoogleCombo(code);
    if (applied === false) {
      window.location.reload();
      return;
    }
  }

  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langSwitch.classList.toggle('open');
    langBtn.setAttribute('aria-expanded', langSwitch.classList.contains('open') ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (!langSwitch.contains(e.target as Node)) langSwitch.classList.remove('open');
  });

  const active = currentLangFromCookie();
  langBtnLabel.textContent = (LANGS.find((l) => l.code === active) || LANGS[0]).label;
  buildDropdown(active);

  // Load Google Translate script
  (window as any).googleTranslateElementInit = function () {
    new (window as any).google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        includedLanguages: LANGS.filter((l) => l.code !== 'en').map((l) => l.code).join(','),
        autoDisplay: false,
      },
      'google_translate_element'
    );
  };

  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  document.body.appendChild(s);
}

// ----------------------------------------------------------------------------
// 3. RESPONSIVE MOBILE MENU CONTROLLER (SINGLETON, DELEGATED, ACCESSIBLE)
// ----------------------------------------------------------------------------
let mobileMenuBound = false;

function initMobileMenu() {
  if (mobileMenuBound) return;
  mobileMenuBound = true;

  const ham = document.getElementById('ham');
  const mobMenu = document.getElementById('mobMenu');

  function openMenu() {
    if (!mobMenu) return;
    if (ham) {
      ham.classList.add('open');
      ham.setAttribute('aria-expanded', 'true');
    }
    mobMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!mobMenu) return;
    if (ham) {
      ham.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
    }
    mobMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    if (!mobMenu) return;
    if (mobMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Register on window for inline onclick="closeMob()" and external triggers
  (window as any).closeMob = closeMenu;
  (window as any).openMob = openMenu;
  (window as any).toggleMob = toggleMenu;

  if (ham) {
    ham.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
  }

  // Delegated click listener so dynamically populated links or mobClose always work
  if (mobMenu) {
    mobMenu.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('#mobClose') ||
        target.closest('.mob-close') ||
        target.tagName === 'A' ||
        target.closest('a')
      ) {
        closeMenu();
      }
    });
  }

  // Close when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });

  // Close when resized back to desktop
  window.addEventListener(
    'resize',
    () => {
      if (window.innerWidth > 960 && mobMenu?.classList.contains('open')) {
        closeMenu();
      }
    },
    { passive: true }
  );
}

// ----------------------------------------------------------------------------
// 4. SMART DESKTOP MAILTO & GMAIL COMPOSER INTEGRATION
// ----------------------------------------------------------------------------
let toastTimer: any = null;

function showCyberToast(message: string) {
  let toast = document.getElementById('cyber-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cyber-toast';
    toast.className = 'cyber-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span class="ct-icon">✉</span> <span>${escapeHtml(message)}</span>`;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast?.classList.remove('show');
  }, 4000);
}

let mailtoHandlerBound = false;

function initMailtoHandler() {
  if (mailtoHandlerBound) return;
  mailtoHandlerBound = true;

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    if (!href.toLowerCase().startsWith('mailto:')) return;

    // Detect mobile touch devices (phones and tablets)
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      // On mobile devices, native Gmail / Apple Mail apps handle mailto: directly
      return;
    }

    // On desktop browsers (e.g. Chrome on Windows):
    // Native mailto: links silently fail when no local OS client (Outlook) is registered.
    // Intercept click to open Gmail Web Composer in a new tab, copy email to clipboard, and show cyber toast.
    e.preventDefault();

    const clean = href.replace(/^mailto:/i, '');
    const [emailPart, queryPart] = clean.split('?');
    const email = decodeURIComponent(emailPart || '241310022@nitdelhi.ac.in');
    let subject = 'Hiring Inquiry — Guna Sai';
    let body = '';

    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      subject = params.get('subject') || params.get('su') || subject;
      body = params.get('body') || '';
    }

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}${body ? '&body=' + encodeURIComponent(body) : ''}`;

    // 1. Copy email address to clipboard as an instant fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).catch(() => {});
    }

    // 2. Open Gmail Web compose in a new tab
    const win = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      // If popup blocker intervened, fall back to setting location
      window.location.href = href;
    }

    // 3. Display cyber toast notification
    showCyberToast(`Opening Gmail · ${email} copied to clipboard!`);
  });
}

// Kick off hydration, mobile menu, mailto handler, and language switcher
function boot() {
  initMobileMenu();
  initMailtoHandler();
  hydratePortfolio();
  initLanguageSwitcher();
  initVisitorAnalytics(API_BASE_URL);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
