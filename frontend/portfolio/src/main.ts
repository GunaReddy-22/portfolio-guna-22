import { renderBlock } from './renderers.js';
import { escapeHtml, escapeAttr, sanitizeUrl } from './sanitize.js';

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
// 1. DYNAMIC CONTENT HYDRATION
// ----------------------------------------------------------------------------
async function hydratePortfolio() {
  const urlParams = new URLSearchParams(window.location.search);
  let previewToken = urlParams.get('token');
  const previewParam = urlParams.get('preview');
  if (!previewToken && previewParam && previewParam !== 'true') {
    previewToken = previewParam;
  }
  const isPreview = Boolean(previewToken || previewParam === 'true');

  let pageApiUrl = '/api/v1/public/pages/home';
  if (isPreview && previewToken) {
    pageApiUrl = `/api/v1/public/pages/home?preview=true&token=${encodeURIComponent(previewToken)}`;
    const banner = document.getElementById('cms-preview-banner');
    if (banner) banner.style.display = 'flex';
  }

  try {
    // 1. Fetch public site settings
    const siteRes = await fetch(resolveApiUrl('/api/v1/public/site'));
    if (siteRes.ok) {
      const siteJson = await siteRes.json();
      if (siteJson.success && siteJson.data) {
        applySiteSettings(siteJson.data);
      }
    }

    // 2. Fetch page sections
    const pageRes = await fetch(resolveApiUrl(pageApiUrl));
    if (pageRes.ok) {
      const pageJson = await pageRes.json();
      if (pageJson.success && pageJson.data?.sections) {
        const root = document.getElementById('cms-sections-root');
        if (root) {
          root.innerHTML = pageJson.data.sections.map((sec: any) => renderBlock(sec)).join('');
          if (isPreview) {
            const badge = document.getElementById('preview-rev-badge');
            if (badge) badge.textContent = `#${pageJson.data.revision || 'DRAFT'}`;
          }
          bindFormSubmissions();
          setupInteractiveBehaviors();
          return;
        }
      }
    }
  } catch (err) {
    console.warn('[CMS Hydration] Could not reach CMS API, rendering baseline fallback:', err);
  }

  // Fallback to baseline if API fails
  renderFallbackSections();
  setupInteractiveBehaviors();
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

        mobMenu.innerHTML = `<button class="mob-close" id="mobClose" aria-label="Close menu">&times;</button>${mobLinksHtml}${mobCtaHtml}${mobMechHtml}`;
        const newClose = document.getElementById('mobClose');
        if (newClose) {
          newClose.addEventListener('click', () => {
            mobMenu.classList.remove('open');
            document.body.style.overflow = '';
          });
        }
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

  // Baseline structure extracted from original portfolio
  root.innerHTML = `
    <section id="hero">
      <div class="orb1 hero-orb"></div>
      <div class="orb2 hero-orb"></div>
      <div class="orb3 hero-orb"></div>
      <div class="bg-grid"></div>
      <div class="float-tag ft1">Node.js</div>
      <div class="float-tag ft2">PostgreSQL</div>
      <div class="float-tag ft3">React.js</div>
      <div class="float-tag ft4">React Native</div>
      <div class="float-tag ft5">RAG / LLM</div>
      <div class="hero-inner">
        <div class="hero-text">
          <div class="hero-pill"><span class="pulse"></span>Full Stack Developer Intern @ ZenithIndia</div>
          <div class="hero-eyebrow"><span class="eyebrow-dash"></span>Full-Stack Developer · AI Builder</div>
          <h1 class="hero-name">GUNA<span class="name-serif">Sai Venkata Reddy</span><span class="name-last">KOVVURI</span></h1>
          <p class="hero-desc">B.Tech student at <strong>NIT Delhi</strong> crafting production-grade full-stack, mobile, and AI-powered applications. I build scalable systems, implement RAG pipelines, ship real products across web, Android, and desktop.</p>
          <div class="hero-btns">
            <a href="#projects" class="btn-primary">View Projects &rarr;</a>
            <a href="#resume" class="btn-secondary">View Resume</a>
          </div>
          <div class="hero-stats">
            <div class="hstat"><div class="hstat-num">100<span class="suf">+</span></div><div class="hstat-label">DSA Problems</div></div>
            <div class="hstat"><div class="hstat-num">5</div><div class="hstat-label">Shipped Projects</div></div>
            <div class="hstat"><div class="hstat-num">8.04</div><div class="hstat-label">CGPA</div></div>
          </div>
        </div>
        <div class="hero-photo-wrap">
          <div class="hero-photo-ring"></div>
          <div class="hero-photo-frame">
            <div class="photo-corner pc-tl"></div>
            <div class="photo-corner pc-br"></div>
            <img src="/assets/hero-portrait.jpg" alt="Guna Sai Venkata Reddy Kovvuri" />
            <div class="photo-badge">
              <div class="pb-dot"></div>
              <div class="pb-text">OPEN TO WORK<strong>Full-Stack &amp; AI Roles</strong></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div class="marquee-strip">
      <div class="marquee-inner">
        <span>FULL-STACK DEVELOPMENT</span><span>AI &amp; LLM AGENTS</span><span>REACT NATIVE</span><span>POSTGRESQL &amp; MONGODB</span><span>CLOUD ARCHITECTURE</span><span>FASTAPI &amp; NODE.JS</span>
        <span>FULL-STACK DEVELOPMENT</span><span>AI &amp; LLM AGENTS</span><span>REACT NATIVE</span><span>POSTGRESQL &amp; MONGODB</span><span>CLOUD ARCHITECTURE</span><span>FASTAPI &amp; NODE.JS</span>
      </div>
    </div>
  `;
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

  // Dual cursor
  const dot = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  if (dot && ring) {
    let mx = 0,
      my = 0,
      rx = 0,
      ry = 0;
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    });
    document.addEventListener('mousedown', () => dot.classList.add('click'));
    document.addEventListener('mouseup', () => dot.classList.remove('click'));
    (function loop() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('a,button,.proj-card,.hl-card,.skill-block,.clink,.exp-card,.resume-frame').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('big'));
      el.addEventListener('mouseleave', () => ring.classList.remove('big'));
    });
  }

  // Sticky navbar
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => nav.classList.toggle('stuck', window.scrollY > 60), { passive: true });
  }

  // Mobile menu
  const ham = document.getElementById('ham');
  const mobMenu = document.getElementById('mobMenu');
  const mobClose = document.getElementById('mobClose');
  if (ham && mobMenu) {
    ham.addEventListener('click', () => {
      ham.classList.toggle('open');
      mobMenu.classList.toggle('open');
    });
  }
  if (mobClose && ham && mobMenu) {
    mobClose.addEventListener('click', () => {
      ham.classList.remove('open');
      mobMenu.classList.remove('open');
    });
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

function getCookie(name: string) {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? decodeURIComponent(m.pop()!) : '';
}
function setGoogTransCookie(langCode: string) {
  const val = langCode === 'en' ? '/en/en' : '/en/' + langCode;
  document.cookie = 'googtrans=' + val + ';path=/;';
  document.cookie = 'googtrans=' + val + ';path=/;domain=' + location.hostname + ';';
}
function currentLangFromCookie() {
  const c = getCookie('googtrans');
  if (!c) return 'en';
  const parts = c.split('/').filter(Boolean);
  return parts[1] || 'en';
}

function initLanguageSwitcher() {
  const langBtn = document.getElementById('langBtn');
  const langBtnLabel = document.getElementById('langBtnLabel');
  const langDropdown = document.getElementById('langDropdown');
  const langSwitch = document.getElementById('langSwitch');

  if (!langBtn || !langBtnLabel || !langDropdown || !langSwitch) return;

  function buildDropdown(activeCode: string) {
    if (!langDropdown) return;
    langDropdown.innerHTML = '';
    LANGS.forEach((l) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-opt' + (l.code === activeCode ? ' active' : '');
      btn.setAttribute('role', 'option');
      btn.innerHTML = `<span>${l.name}</span><span class="lo-native">${l.native}</span>`;
      btn.addEventListener('click', () => selectLanguage(l.code));
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
    if (nativeSetter) nativeSetter.call(combo, code);
    combo.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function selectLanguage(code: string) {
    langSwitch?.classList.remove('open');
    langBtn?.setAttribute('aria-expanded', 'false');
    const found = LANGS.find((l) => l.code === code) || LANGS[0];
    if (langBtnLabel) langBtnLabel.textContent = found.label;
    buildDropdown(code);
    setGoogTransCookie(code);

    const applied = triggerGoogleCombo(code);
    if (applied === false) {
      location.reload();
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
        includedLanguages: LANGS.map((l) => l.code).join(','),
        autoDisplay: false,
      },
      'google_translate_element'
    );
  };

  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  document.body.appendChild(s);
}

// Kick off hydration and language switcher
document.addEventListener('DOMContentLoaded', () => {
  hydratePortfolio();
  initLanguageSwitcher();
});
