/**
 * Guna Portfolio Client-Side Visitor Analytics Tracker
 * Elite telemetry: Hardware X-Ray, Network Quality, User Preferences,
 * Anonymous Fingerprinting, Scroll Depth, Section Dwell Times, and High-Intent Action tracking.
 * Lightweight (<5KB), zero external dependencies, 100% non-blocking.
 */

const STORAGE_KEY_SESSION = 'guna_vid_session';
const STORAGE_KEY_DISABLED = 'guna_disable_analytics';
const STORAGE_KEY_FP = 'guna_vid_fp';

interface PendingEvent {
  type: string;
  label: string;
  target?: string;
  timestamp: string;
}

export function initVisitorAnalytics(apiBaseUrl: string): void {
  // 1. Guard against SSR or disabled tracking
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (localStorage.getItem(STORAGE_KEY_DISABLED) === 'true') {
    return;
  }

  // 2. Hardware GPU Renderer Detection
  const gpuRenderer = getGpuRenderer();

  // 3. Deterministic Anonymous Device Fingerprint (Zero Cookie / Incognito resilient)
  let visitorFingerprint = localStorage.getItem(STORAGE_KEY_FP);
  if (!visitorFingerprint) {
    visitorFingerprint = generateFingerprint(gpuRenderer);
    try {
      localStorage.setItem(STORAGE_KEY_FP, visitorFingerprint);
    } catch {
      // Storage access may be restricted
    }
  }

  // 4. Retrieve or generate anonymous session ID
  let sessionId = localStorage.getItem(STORAGE_KEY_SESSION);
  if (!sessionId) {
    sessionId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, sessionId);
    } catch {
      // Storage access may be restricted
    }
  }

  const endpointTrack = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/public/analytics/track`;
  const endpointHeartbeat = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/public/analytics/heartbeat`;
  const endpointEvent = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/public/analytics/event`;

  // 5. Gather Environmental Telemetry
  const referrer = document.referrer || 'Direct';
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source') || urlParams.get('ref') || undefined;

  const currentPath = window.location.pathname + (window.location.hash || '');
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const language = navigator.language || 'en-US';
  const languages = navigator.languages ? Array.from(navigator.languages) : [language];

  // Hardware X-Ray
  const cpuCores = navigator.hardwareConcurrency || undefined;
  const deviceMemoryGb = (navigator as any).deviceMemory || undefined;
  const touchPoints = navigator.maxTouchPoints || 0;
  const pixelRatio = window.devicePixelRatio || 1;
  const colorDepth = window.screen.colorDepth || undefined;

  // Network Telemetry
  const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const connectionType = navConn?.effectiveType || '';
  const downlinkMbps = navConn?.downlink || undefined;
  const rttMs = navConn?.rtt || undefined;
  const saveData = Boolean(navConn?.saveData);

  // System Preferences
  const colorScheme = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
    ? 'dark'
    : window.matchMedia?.('(prefers-color-scheme: light)')?.matches
    ? 'light'
    : 'no-preference';
  const reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

  const startTime = Date.now();
  let maxScrollPercentage = 0;
  const sectionDwellTimes: Record<string, number> = {};
  let currentActiveSection = window.location.hash || '/';
  let activeSeconds = 0;
  let idleSeconds = 0;
  let lastUserActivityTime = Date.now();
  const pendingEvents: PendingEvent[] = [];

  // 6. User Activity Listener (determines active reading vs idle background)
  const recordActivity = () => {
    lastUserActivityTime = Date.now();
  };
  ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach((evt) => {
    window.addEventListener(evt, recordActivity, { passive: true });
  });

  // Ticking dwell time and focus counter every second
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      const isUserActive = Date.now() - lastUserActivityTime < 45000;
      if (isUserActive) {
        activeSeconds++;
        sectionDwellTimes[currentActiveSection] = (sectionDwellTimes[currentActiveSection] || 0) + 1;
      } else {
        idleSeconds++;
      }
    } else {
      idleSeconds++;
    }
  }, 1000);

  // 7. Scroll Depth Calculator
  const updateScrollDepth = () => {
    try {
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight
      );
      const winHeight = window.innerHeight;
      const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      if (docHeight <= winHeight) {
        maxScrollPercentage = 100;
        return;
      }
      const pct = Math.min(100, Math.max(0, Math.round(((scrollTop + winHeight) / docHeight) * 100)));
      if (pct > maxScrollPercentage) {
        maxScrollPercentage = pct;
      }

      // Detect current visible section
      const sections = ['#contact', '#experience', '#projects', '#skills', '#about', '#hero'];
      for (const secId of sections) {
        const el = document.querySelector(secId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= winHeight * 0.5 && rect.bottom >= winHeight * 0.2) {
            currentActiveSection = secId;
            break;
          }
        }
      }
    } catch {
      // Ignore
    }
  };

  window.addEventListener('scroll', updateScrollDepth, { passive: true });
  updateScrollDepth();

  // 8. Safe beacon sender
  const sendBeaconPayload = (url: string, data: any) => {
    try {
      const json = JSON.stringify(data);
      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([json], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: json,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking
    }
  };

  // 9. Send initial visit beacon asynchronously after idle/paint
  const sendInitialVisit = () => {
    const payload = {
      sessionId,
      visitorFingerprint,
      path: currentPath,
      referrer,
      utmSource,
      screenResolution,
      language,
      languages,
      // Hardware
      gpuRenderer,
      cpuCores,
      deviceMemoryGb,
      touchPoints,
      pixelRatio,
      colorDepth,
      // Network
      connectionType,
      downlinkMbps,
      rttMs,
      saveData,
      // Preferences
      colorScheme,
      reducedMotion,
    };

    sendBeaconPayload(endpointTrack, payload);
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(sendInitialVisit, { timeout: 2000 });
  } else {
    setTimeout(sendInitialVisit, 500);
  }

  // 10. Send Heartbeat with engagement metrics
  const sendHeartbeat = () => {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const eventsToSend = pendingEvents.splice(0, pendingEvents.length);

    const payload = {
      sessionId,
      path: window.location.pathname + (window.location.hash || ''),
      durationSeconds: elapsedSeconds,
      activeSeconds,
      idleSeconds,
      maxScrollPercentage,
      sectionDwellTimes,
      events: eventsToSend,
    };

    sendBeaconPayload(endpointHeartbeat, payload);
  };

  // Track in-page section navigation (#projects, #experience, #contact)
  const trackHashChange = () => {
    currentActiveSection = window.location.hash || '/';
    sendHeartbeat();
  };
  window.addEventListener('hashchange', trackHashChange, { passive: true });

  // Regular 15-second heartbeat
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      sendHeartbeat();
    }
  }, 15000);

  // Tab hide / page unload beacon
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendHeartbeat();
    }
  });
  window.addEventListener('pagehide', sendHeartbeat);

  // 11. High-Intent Action Tracking (Click Delegation & Copy Events)
  const trackHighIntentClick = (evt: MouseEvent) => {
    const target = evt.target as HTMLElement | null;
    if (!target) return;

    const link = target.closest('a') as HTMLAnchorElement | null;
    if (!link || !link.href) return;

    const href = link.href;
    const hrefLower = href.toLowerCase();

    // A. Resume / CV Download
    if (
      hrefLower.endsWith('.pdf') ||
      hrefLower.includes('resume') ||
      hrefLower.includes('cv') ||
      link.dataset.analytics === 'resume'
    ) {
      const eventItem = {
        type: 'resume_download',
        label: 'Downloaded Resume (CV)',
        target: href,
        timestamp: new Date().toISOString(),
      };
      pendingEvents.push(eventItem);
      sendBeaconPayload(endpointEvent, { sessionId, ...eventItem });
      return;
    }

    // B. External Links (GitHub, LinkedIn, Live Demos, Play Store)
    const isExternal = !href.startsWith(window.location.origin) && href.startsWith('http');
    if (isExternal) {
      let label = 'Live Project / Demo Link';
      if (hrefLower.includes('github.com')) {
        label = 'GitHub Repository / Profile';
      } else if (hrefLower.includes('linkedin.com')) {
        label = 'LinkedIn Profile';
      } else if (hrefLower.includes('play.google.com')) {
        label = 'Google Play Store App';
      } else if (hrefLower.includes('twitter.com') || hrefLower.includes('x.com')) {
        label = 'Twitter / X Profile';
      }

      const eventItem = {
        type: 'external_link_click',
        label,
        target: href,
        timestamp: new Date().toISOString(),
      };
      pendingEvents.push(eventItem);
      sendBeaconPayload(endpointEvent, { sessionId, ...eventItem });
    }
  };

  document.addEventListener('click', trackHighIntentClick, { capture: true, passive: true });

  // C. Copy-to-Clipboard Detection (e.g. copying email or phone number)
  document.addEventListener(
    'copy',
    () => {
      try {
        const selection = window.getSelection()?.toString() || '';
        if (selection.includes('@') || /[\d-]{10,}/.test(selection)) {
          const eventItem = {
            type: 'contact_copy',
            label: 'Copied Contact Email / Phone',
            target: selection.slice(0, 50),
            timestamp: new Date().toISOString(),
          };
          pendingEvents.push(eventItem);
          sendBeaconPayload(endpointEvent, { sessionId, ...eventItem });
        }
      } catch {
        // Ignore
      }
    },
    { passive: true }
  );
}

/**
 * Extracts unmasked WebGL GPU chip name if available
 */
function getGpuRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    const ext = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!ext) return '';
    const renderer = (gl as any).getParameter(ext.UNMASKED_RENDERER_WEBGL);
    return typeof renderer === 'string' ? renderer.replace(/ANGLE \(([^,]+), ([^,]+).*/, '$2 ($1)') : '';
  } catch {
    return '';
  }
}

/**
 * Generates lightweight, non-invasive deterministic hardware fingerprint
 */
function generateFingerprint(gpu: string): string {
  try {
    const components = [
      window.screen.width,
      window.screen.height,
      window.screen.colorDepth,
      window.devicePixelRatio || 1,
      navigator.hardwareConcurrency || 0,
      (navigator as any).deviceMemory || 0,
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      gpu,
    ].join('###');

    let hash = 0x811c9dc5;
    for (let i = 0; i < components.length; i++) {
      hash ^= components.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return 'fp_' + (hash >>> 0).toString(16);
  } catch {
    return 'fp_generic';
  }
}
