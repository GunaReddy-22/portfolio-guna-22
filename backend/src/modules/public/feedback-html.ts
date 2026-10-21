/**
 * Generates standalone, responsive HTML for public feedback forms
 * styled with the authentic Guna Portfolio design system (tokens, fonts, grid, orbs, cursor, and card aesthetics).
 */

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTitleWithSerifAccent(rawTitle: string): string {
  const clean = escapeHtml(rawTitle.trim());
  const words = clean.split(/\s+/);
  if (words.length <= 1) {
    return clean;
  }
  const main = words.slice(0, -1).join(' ');
  const last = words[words.length - 1];
  return `${main} <span class="serif-accent">${last}</span>`;
}

export function renderFeedbackFormHtml(form: any, baseUrl: string = ''): string {
  const formTitle = escapeHtml(form.title || 'App Feedback Form');
  const formattedHeroTitle = formatTitleWithSerifAccent(form.title || 'App Feedback Form');
  const formDescription = escapeHtml(
    form.description || 'Please share your thoughts, feature requests, or report any issues to help improve the application.'
  );
  const submitButtonText = escapeHtml(form.submitButtonText || 'Submit Feedback');
  const successMessage = escapeHtml(
    form.successMessage || 'Thank you! Your feedback has been received and will help improve the app.'
  );
  const formSlug = escapeHtml(form.slug);

  const fieldsHtml = (form.fields || []).map((field: any, idx: number) => {
    const fieldId = `field_${idx}_${escapeHtml(field.name)}`;
    const fieldName = escapeHtml(field.name);
    const fieldLabel = escapeHtml(field.label || field.name);
    const isRequired = Boolean(field.required);
    const placeholder = escapeHtml(field.placeholder || '');
    const helpText = field.helpText ? `<p class="field-help">${escapeHtml(field.helpText)}</p>` : '';

    if (field.type === 'rating') {
      return `
        <div class="cms-form-field" data-field-type="rating">
          <label class="cms-form-label">
            ${fieldLabel}
            ${isRequired ? '<span class="req">*</span>' : ''}
          </label>
          <div class="rating-stars" data-name="${fieldName}">
            <input type="hidden" name="${fieldName}" id="${fieldId}" value="" ${isRequired ? 'required' : ''} />
            <div class="stars-row">
              ${[1, 2, 3, 4, 5].map((val) => `
                <button type="button" class="star-btn" data-value="${val}" aria-label="${val} Stars" title="${val} Stars">
                  <svg class="star-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </button>
              `).join('')}
            </div>
            <div class="rating-label" id="rating_label_${fieldName}">SELECT RATING</div>
          </div>
          ${helpText}
        </div>
      `;
    }

    if (field.type === 'textarea') {
      return `
        <div class="cms-form-field">
          <label class="cms-form-label" for="${fieldId}">
            ${fieldLabel}
            ${isRequired ? '<span class="req">*</span>' : ''}
          </label>
          <textarea
            class="cms-form-textarea"
            id="${fieldId}"
            name="${fieldName}"
            placeholder="${placeholder}"
            rows="4"
            ${isRequired ? 'required' : ''}
          ></textarea>
          ${helpText}
        </div>
      `;
    }

    if (field.type === 'select') {
      const options = field.options || ['Option 1', 'Option 2', 'Option 3'];
      return `
        <div class="cms-form-field">
          <label class="cms-form-label" for="${fieldId}">
            ${fieldLabel}
            ${isRequired ? '<span class="req">*</span>' : ''}
          </label>
          <div class="select-wrapper">
            <select class="cms-form-select" id="${fieldId}" name="${fieldName}" ${isRequired ? 'required' : ''}>
              <option value="" disabled selected>${placeholder || 'Select an option...'}</option>
              ${options.map((opt: string) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
            </select>
          </div>
          ${helpText}
        </div>
      `;
    }

    if (field.type === 'checkbox') {
      return `
        <div class="cms-form-field">
          <label class="checkbox-label" for="${fieldId}">
            <input
              type="checkbox"
              class="cms-form-checkbox"
              id="${fieldId}"
              name="${fieldName}"
              value="yes"
              ${isRequired ? 'required' : ''}
            />
            <span class="checkbox-text">${fieldLabel} ${isRequired ? '<span class="req">*</span>' : ''}</span>
          </label>
          ${helpText}
        </div>
      `;
    }

    const inputType =
      field.type === 'email'
        ? 'email'
        : field.type === 'number'
        ? 'number'
        : field.type === 'tel'
        ? 'tel'
        : field.type === 'url'
        ? 'url'
        : 'text';

    return `
      <div class="cms-form-field">
        <label class="cms-form-label" for="${fieldId}">
          ${fieldLabel}
          ${isRequired ? '<span class="req">*</span>' : ''}
        </label>
        <input
          type="${inputType}"
          class="cms-form-input"
          id="${fieldId}"
          name="${fieldName}"
          placeholder="${placeholder}"
          ${isRequired ? 'required' : ''}
        />
        ${helpText}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formTitle} — Guna Sai Venkata Reddy Kovvuri</title>

  <!-- Authentic Portfolio Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400;1,9..144,500&family=Space+Mono:wght@400;700&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">

  <style>
    /* ==========================================================================
       GUNA SAI PORTFOLIO DESIGN SYSTEM & CSS TOKENS
       ========================================================================== */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --void: #050508;
      --deep: #080c14;
      --surface: #0d1220;
      --border: rgba(255, 255, 255, 0.07);
      --border2: rgba(255, 200, 80, 0.25);
      --text: #e8eaf0;
      --text-soft: #8892a4;
      --text-muted: #4a5568;
      --amber: #ffc84a;
      --amber-dim: #c99a2e;
      --violet: #7c5cfc;
      --teal: #00d4b4;
      --rose: #ff6b8a;
      --ff-display: 'Bricolage Grotesque', Georgia, 'Segoe UI', sans-serif;
      --ff-serif: 'Fraunces', Georgia, 'Times New Roman', serif;
      --ff-mono: 'Space Mono', 'Courier New', monospace;
      --ff-body: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
    }

    html {
      scroll-behavior: smooth;
      overflow-x: hidden;
    }

    body {
      background: var(--void);
      color: var(--text);
      font-family: var(--ff-body);
      font-size: 15px;
      line-height: 1.7;
      overflow-x: hidden;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Dual cursor */
    #cur-dot {
      position: fixed;
      top: 0;
      left: 0;
      width: 8px;
      height: 8px;
      background: var(--amber);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 9999;
      transition: width .15s, height .15s;
    }
    #cur-ring {
      position: fixed;
      top: 0;
      left: 0;
      width: 36px;
      height: 36px;
      border: 1.5px solid rgba(255, 200, 74, 0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 9998;
      transition: width .3s, height .3s, border-color .3s, background .3s;
    }
    #cur-ring.big {
      width: 60px;
      height: 60px;
      border-color: var(--amber);
      background: rgba(255, 200, 74, 0.05);
    }
    #cur-dot.click {
      width: 14px;
      height: 14px;
    }

    @media (max-width: 960px) {
      #cur-dot, #cur-ring {
        display: none !important;
      }
    }

    /* Scrollbars */
    ::-webkit-scrollbar {
      width: 4px;
    }
    ::-webkit-scrollbar-track {
      background: var(--void);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--amber-dim);
      border-radius: 2px;
    }

    /* Background Geometric Grid & Glow Orbs */
    .bg-grid {
      position: fixed;
      inset: 0;
      background-image: linear-gradient(rgba(255, 200, 74, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 200, 74, 0.03) 1px, transparent 1px);
      background-size: 64px 64px;
      pointer-events: none;
      z-index: 0;
    }

    .hero-orb {
      position: fixed;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(75px);
      z-index: 0;
      opacity: 0.65;
    }
    .orb1 {
      width: 680px;
      height: 680px;
      top: -10%;
      right: -8%;
      background: radial-gradient(circle, rgba(124, 92, 252, 0.18) 0%, transparent 70%);
      animation: orbFloat1 14s ease-in-out infinite;
    }
    .orb2 {
      width: 580px;
      height: 580px;
      bottom: -15%;
      left: -8%;
      background: radial-gradient(circle, rgba(0, 212, 180, 0.13) 0%, transparent 70%);
      animation: orbFloat2 18s ease-in-out infinite;
    }
    .orb3 {
      width: 420px;
      height: 420px;
      top: 35%;
      left: 30%;
      background: radial-gradient(circle, rgba(255, 200, 74, 0.09) 0%, transparent 65%);
      animation: orbFloat3 11s ease-in-out infinite;
    }
    @keyframes orbFloat1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(-30px, 25px) scale(1.04); }
      66% { transform: translate(20px, -15px) scale(0.97); }
    }
    @keyframes orbFloat2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(35px, -30px) scale(1.07); }
    }
    @keyframes orbFloat3 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(-18px, 22px); }
    }

    /* Floating tags */
    .float-tag {
      position: fixed;
      font-family: var(--ff-mono);
      font-size: 10px;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      border: 1px solid var(--border);
      padding: 6px 14px;
      border-radius: 100px;
      background: rgba(13, 18, 32, 0.7);
      backdrop-filter: blur(8px);
      pointer-events: none;
      animation: floatTag 6s ease-in-out infinite;
      z-index: 1;
    }
    .ft1 { top: 16%; left: 8%; animation-delay: 0s; }
    .ft2 { top: 75%; left: 10%; animation-delay: 1.5s; }
    .ft3 { top: 22%; right: 9%; animation-delay: 3s; }
    .ft4 { top: 68%; right: 7%; animation-delay: 2s; }
    @keyframes floatTag {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
    }

    @media (max-width: 960px) {
      .float-tag { display: none !important; }
    }

    /* Top Navigation Header */
    nav.site-nav {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 64px;
      position: relative;
      z-index: 20;
      border-bottom: 1px solid var(--border);
      background: rgba(5, 5, 8, 0.85);
      backdrop-filter: blur(20px);
    }
    @media (max-width: 768px) {
      nav.site-nav {
        padding: 16px 20px;
      }
    }
    .logo {
      font-family: var(--ff-display);
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 2px;
      color: var(--text);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .logo-dot {
      color: var(--amber);
    }
    .nav-cta {
      border: 1px solid var(--border2) !important;
      padding: 8px 20px;
      border-radius: 3px;
      color: var(--amber) !important;
      font-family: var(--ff-mono);
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      text-decoration: none;
      transition: all .3s !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .nav-cta:hover {
      background: var(--amber) !important;
      color: var(--void) !important;
      border-color: var(--amber) !important;
    }

    /* Main Container */
    main.page-main {
      flex: 1;
      width: 100%;
      max-width: 740px;
      margin: 0 auto;
      padding: 56px 24px 80px;
      position: relative;
      z-index: 10;
    }

    @media (max-width: 640px) {
      main.page-main {
        padding: 32px 16px 60px;
      }
    }

    /* Eyebrow & Pill Header */
    .hero-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 200, 74, 0.09);
      border: 1px solid rgba(255, 200, 74, 0.22);
      border-radius: 100px;
      padding: 8px 18px;
      font-family: var(--ff-mono);
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--amber);
      margin-bottom: 24px;
    }
    .pulse {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--amber);
      flex-shrink: 0;
      animation: pulseAnim 2s infinite;
    }
    @keyframes pulseAnim {
      0% { box-shadow: 0 0 0 0 rgba(255, 200, 74, .5); }
      70% { box-shadow: 0 0 0 10px rgba(255, 200, 74, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 200, 74, 0); }
    }

    .hero-eyebrow {
      display: flex;
      align-items: center;
      gap: 14px;
      font-family: var(--ff-mono);
      font-size: 11px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--amber);
      margin-bottom: 14px;
    }
    .eyebrow-dash {
      width: 32px;
      height: 1px;
      background: var(--amber);
    }

    h1.form-hero-title {
      font-family: var(--ff-display);
      font-size: clamp(32px, 5.5vw, 48px);
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.5px;
      color: var(--text);
      margin-bottom: 12px;
    }
    h1.form-hero-title .serif-accent {
      font-family: var(--ff-serif);
      font-style: italic;
      font-weight: 400;
      color: var(--amber);
      letter-spacing: 1px;
    }

    .form-hero-desc {
      font-size: 15px;
      color: var(--text-soft);
      line-height: 1.8;
      max-width: 620px;
      margin-bottom: 36px;
    }

    /* Form Wrapper Card (Authentic cms-form-wrapper from portfolio.css) */
    .cms-form-wrapper {
      background: rgba(13, 18, 32, 0.85);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 44px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
    }
    .cms-form-wrapper::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--amber), var(--violet), var(--teal));
    }

    @media (max-width: 640px) {
      .cms-form-wrapper {
        padding: 24px 18px;
        border-radius: 8px;
      }
    }

    /* Form Fields */
    .cms-form-field {
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cms-form-label {
      font-family: var(--ff-mono);
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-soft);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .cms-form-label .req {
      color: var(--rose);
      font-weight: 700;
    }

    .cms-form-input,
    .cms-form-textarea,
    .cms-form-select {
      background: rgba(5, 5, 8, 0.7);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 13px 18px;
      color: var(--text);
      font-family: var(--ff-body);
      font-size: 14.5px;
      outline: none;
      transition: border-color .25s, box-shadow .25s, background .25s;
      width: 100%;
    }
    .cms-form-input:focus,
    .cms-form-textarea:focus,
    .cms-form-select:focus {
      border-color: var(--amber);
      background: rgba(8, 12, 20, 0.9);
      box-shadow: 0 0 0 1px var(--amber), 0 0 20px rgba(255, 200, 74, 0.12);
    }

    .cms-form-textarea {
      resize: vertical;
      min-height: 100px;
      line-height: 1.6;
    }

    .field-help {
      font-family: var(--ff-mono);
      font-size: 10.5px;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    /* Select menu wrapper */
    .select-wrapper {
      position: relative;
    }
    .cms-form-select {
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffc84a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E");
      background-repeat: no-repeat;
      background-position: right 16px center;
      padding-right: 42px;
      cursor: pointer;
    }
    .cms-form-select option {
      background: var(--deep);
      color: var(--text);
    }

    /* Checkbox */
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      user-select: none;
    }
    .cms-form-checkbox {
      width: 18px;
      height: 18px;
      accent-color: var(--amber);
      cursor: pointer;
    }
    .checkbox-text {
      font-size: 14px;
      color: var(--text);
    }
    .checkbox-text .req {
      color: var(--rose);
    }

    /* Star Rating with Portfolio Amber & Monospace Label */
    .rating-stars {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(5, 5, 8, 0.4);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      transition: border-color .2s;
    }
    .rating-stars:hover {
      border-color: rgba(255, 200, 74, 0.25);
    }
    .stars-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .star-btn {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: var(--text-muted);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .star-btn:hover {
      transform: scale(1.22);
    }
    .star-icon {
      width: 32px;
      height: 32px;
      transition: fill .2s ease, stroke .2s ease;
    }
    .star-btn.active .star-icon,
    .star-btn.hover .star-icon {
      fill: var(--amber);
      stroke: var(--amber);
      filter: drop-shadow(0 0 10px rgba(255, 200, 74, 0.5));
    }
    .rating-label {
      font-family: var(--ff-mono);
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--amber);
      font-weight: 700;
      min-height: 16px;
    }

    /* Anti-spam honeypot */
    .hp-field {
      opacity: 0;
      position: absolute;
      top: 0;
      left: 0;
      height: 0;
      width: 0;
      z-index: -1;
    }

    /* Submit Button (Authentic btn-primary from portfolio.css) */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: var(--amber);
      color: var(--void);
      font-family: var(--ff-mono);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      padding: 16px 36px;
      border-radius: 4px;
      border: none;
      text-decoration: none;
      transition: all .3s;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      width: 100%;
      margin-top: 12px;
    }
    .btn-primary::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, transparent 60%);
    }
    .btn-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 48px rgba(255, 200, 74, 0.4);
    }
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Messages & Alerts (cms-form-error, cms-form-success) */
    .cms-form-msg {
      margin-bottom: 20px;
      font-family: var(--ff-mono);
      font-size: 12px;
      padding: 14px 18px;
      border-radius: 4px;
      display: none;
    }
    .cms-form-error {
      background: rgba(255, 107, 138, 0.1);
      border: 1px solid rgba(255, 107, 138, 0.3);
      color: var(--rose);
      display: block;
    }
    .cms-form-success {
      background: rgba(0, 212, 180, 0.1);
      border: 1px solid rgba(0, 212, 180, 0.3);
      color: var(--teal);
    }

    /* Success State View */
    .success-view {
      display: none;
      text-align: center;
      padding: 32px 16px;
    }
    .success-badge-wrap {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: rgba(0, 212, 180, 0.1);
      border: 1.5px solid rgba(0, 212, 180, 0.4);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      color: var(--teal);
      animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes popIn {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .success-title {
      font-family: var(--ff-display);
      font-size: 28px;
      font-weight: 800;
      color: var(--text);
      margin-bottom: 12px;
    }
    .success-body {
      font-size: 15px;
      color: var(--text-soft);
      line-height: 1.8;
      max-width: 480px;
      margin: 0 auto 32px auto;
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      border: 1px solid var(--border);
      color: var(--text-soft);
      font-family: var(--ff-mono);
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 14px 28px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.02);
      cursor: pointer;
      transition: all .3s;
    }
    .btn-secondary:hover {
      border-color: var(--amber);
      color: var(--amber);
      background: rgba(255, 200, 74, 0.04);
    }

    /* Footer (Authentic Portfolio Footer) */
    footer.site-footer {
      border-top: 1px solid var(--border);
      background: var(--void);
      padding: 24px 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 20;
    }
    @media (max-width: 768px) {
      footer.site-footer {
        flex-direction: column;
        gap: 10px;
        text-align: center;
        padding: 20px;
      }
    }
    .footer-l {
      font-family: var(--ff-mono);
      font-size: 11px;
      letter-spacing: 0.1em;
      color: var(--text-muted);
    }
    .footer-l span {
      color: var(--amber);
    }
    .footer-r {
      font-family: var(--ff-mono);
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <!-- Dual Cursor Elements -->
  <div id="cur-dot"></div>
  <div id="cur-ring"></div>

  <!-- Background Grid & Glowing Orbs -->
  <div class="bg-grid"></div>
  <div class="hero-orb orb1"></div>
  <div class="hero-orb orb2"></div>
  <div class="hero-orb orb3"></div>

  <!-- Floating Tech Tags -->
  <div class="float-tag ft1">BETA TESTING</div>
  <div class="float-tag ft2">FULL-STACK APP</div>
  <div class="float-tag ft3">USER FEEDBACK</div>
  <div class="float-tag ft4">NIT DELHI &middot; 2026</div>

  <!-- Top Navigation Header -->
  <nav class="site-nav">
    <a href="${baseUrl || '/'}" class="logo">
      <span>GS</span><span class="logo-dot">.</span>
    </a>
    <a href="${baseUrl || '/'}" class="nav-cta">
      <span>Portfolio Home</span> &#x2197;
    </a>
  </nav>

  <!-- Main Content Container -->
  <main class="page-main">
    <div class="hero-pill">
      <span class="pulse"></span>
      <span>Public Feedback Form &middot; No Login Required</span>
    </div>

    <div class="hero-eyebrow">
      <span class="eyebrow-dash"></span>
      <span>Application Feedback &middot; Review</span>
    </div>

    <h1 class="form-hero-title">
      ${formattedHeroTitle}
    </h1>
    <p class="form-hero-desc">
      ${formDescription}
    </p>

    <!-- Error Banner -->
    <div id="error_banner" class="cms-form-msg cms-form-error" style="display:none;"></div>

    <!-- Authentic CMS Form Wrapper Card -->
    <div class="cms-form-wrapper">
      <!-- Active Form View -->
      <div id="form_section">
        <form id="feedback_form">
          <!-- Honeypot Bot Trap -->
          <input type="text" name="_hp_trap" class="hp-field" tabindex="-1" autocomplete="off" />

          ${fieldsHtml}

          <button type="submit" id="submit_btn" class="btn-primary">
            <span id="btn_text">${submitButtonText}</span> &#x2197;
          </button>
        </form>
      </div>

      <!-- Success Confirmation View -->
      <div id="success_section" class="success-view">
        <div class="success-badge-wrap">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 class="success-title">Feedback Received!</h2>
        <p class="success-body">${successMessage}</p>
        <button type="button" id="reset_btn" class="btn-secondary">
          <span>Submit Another Response</span> &#x21ba;
        </button>
      </div>
    </div>
  </main>

  <!-- Authentic Portfolio Footer -->
  <footer class="site-footer">
    <div class="footer-l">
      Designed &amp; built by <span>Guna Sai Venkata Reddy Kovvuri</span> &middot; 2026
    </div>
    <div class="footer-r">
      NIT Delhi &middot; Full-Stack Developer
    </div>
  </footer>

  <script>
    (function() {
      // 1. Dual Cursor
      const dot = document.getElementById('cur-dot');
      const ring = document.getElementById('cur-ring');
      if (dot && ring) {
        let mx = 0, my = 0, rx = 0, ry = 0;
        document.addEventListener('mousemove', function(e) {
          mx = e.clientX;
          my = e.clientY;
          dot.style.left = mx + 'px';
          dot.style.top = my + 'px';
        });
        document.addEventListener('mousedown', function() { dot.classList.add('click'); });
        document.addEventListener('mouseup', function() { dot.classList.remove('click'); });

        function cursorLoop() {
          rx += (mx - rx) * 0.12;
          ry += (my - ry) * 0.12;
          ring.style.left = rx + 'px';
          ring.style.top = ry + 'px';
          requestAnimationFrame(cursorLoop);
        }
        requestAnimationFrame(cursorLoop);

        document.querySelectorAll('a, button, .star-btn, input, textarea, select').forEach(function(el) {
          el.addEventListener('mouseenter', function() { ring.classList.add('big'); });
          el.addEventListener('mouseleave', function() { ring.classList.remove('big'); });
        });
      }

      // 2. Interactive Star Ratings
      const ratingLabels = {
        '1': '1/5 STARS &mdash; NEEDS MAJOR IMPROVEMENT',
        '2': '2/5 STARS &mdash; BELOW EXPECTATIONS',
        '3': '3/5 STARS &mdash; GOOD / SATISFACTORY',
        '4': '4/5 STARS &mdash; VERY GOOD &amp; SMOOTH',
        '5': '5/5 STARS &mdash; OUTSTANDING &amp; LOVED IT!'
      };

      document.querySelectorAll('.rating-stars').forEach(function(container) {
        const fieldName = container.getAttribute('data-name');
        const hiddenInput = container.querySelector('input[type="hidden"]');
        const labelEl = document.getElementById('rating_label_' + fieldName);
        const starBtns = container.querySelectorAll('.star-btn');

        function updateStars(val, isHover) {
          starBtns.forEach(function(btn) {
            const btnVal = parseInt(btn.getAttribute('data-value'), 10);
            if (isHover) {
              btn.classList.toggle('hover', btnVal <= val);
            } else {
              btn.classList.toggle('active', btnVal <= val);
            }
          });
          if (val > 0) {
            labelEl.innerHTML = ratingLabels[String(val)] || (val + '/5 STARS');
          } else if (!hiddenInput.value) {
            labelEl.textContent = 'SELECT RATING';
          }
        }

        starBtns.forEach(function(btn) {
          const val = parseInt(btn.getAttribute('data-value'), 10);

          btn.addEventListener('mouseenter', function() {
            updateStars(val, true);
          });

          btn.addEventListener('mouseleave', function() {
            starBtns.forEach(function(b) { b.classList.remove('hover'); });
            const currentVal = parseInt(hiddenInput.value, 10) || 0;
            updateStars(currentVal, false);
          });

          btn.addEventListener('click', function(e) {
            e.preventDefault();
            hiddenInput.value = val;
            updateStars(val, false);
          });
        });
      });

      // 3. Form Submission Handling
      const formEl = document.getElementById('feedback_form');
      const submitBtn = document.getElementById('submit_btn');
      const btnText = document.getElementById('btn_text');
      const errorBanner = document.getElementById('error_banner');
      const formSection = document.getElementById('form_section');
      const successSection = document.getElementById('success_section');
      const resetBtn = document.getElementById('reset_btn');

      formEl.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorBanner.style.display = 'none';

        // Honeypot trap
        const hp = formEl.querySelector('input[name="_hp_trap"]');
        if (hp && hp.value) {
          formSection.style.display = 'none';
          successSection.style.display = 'block';
          return;
        }

        // Validate rating fields
        const requiredRatings = formEl.querySelectorAll('.rating-stars input[type="hidden"][required]');
        for (let i = 0; i < requiredRatings.length; i++) {
          if (!requiredRatings[i].value) {
            errorBanner.textContent = 'Please select a star rating for all required rating fields.';
            errorBanner.style.display = 'block';
            return;
          }
        }

        const formData = new FormData(formEl);
        const payload = {};
        formData.forEach(function(val, key) {
          if (key === '_hp_trap') return;
          payload[key] = val;
        });

        submitBtn.disabled = true;
        btnText.textContent = 'Submitting Feedback...';

        try {
          const res = await fetch('/api/v1/public/forms/${formSlug}/submissions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ data: payload })
          });

          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.error?.message || 'Failed to submit response. Please verify required fields.');
          }

          // Show success state
          formSection.style.display = 'none';
          successSection.style.display = 'block';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
          errorBanner.textContent = err.message || 'Error submitting feedback. Please try again.';
          errorBanner.style.display = 'block';
        } finally {
          submitBtn.disabled = false;
          btnText.textContent = '${submitButtonText}';
        }
      });

      // 4. Reset Button
      resetBtn.addEventListener('click', function() {
        formEl.reset();
        document.querySelectorAll('.star-btn').forEach(function(b) { b.classList.remove('active', 'hover'); });
        document.querySelectorAll('.rating-label').forEach(function(l) { l.textContent = 'SELECT RATING'; });
        successSection.style.display = 'none';
        formSection.style.display = 'block';
      });
    })();
  </script>
</body>
</html>`;
}

