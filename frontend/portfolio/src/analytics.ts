/**
 * Guna Portfolio Client-Side Visitor Analytics Tracker
 * Lightweight (<2KB), zero-dependency, non-blocking beacon tracking.
 */

const STORAGE_KEY_SESSION = 'guna_vid_session';
const STORAGE_KEY_DISABLED = 'guna_disable_analytics';

export function initVisitorAnalytics(apiBaseUrl: string): void {
  // 1. Guard against SSR or disabled tracking
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (localStorage.getItem(STORAGE_KEY_DISABLED) === 'true') {
    return;
  }

  // 2. Retrieve or generate anonymous persistent session ID
  let sessionId = localStorage.getItem(STORAGE_KEY_SESSION);
  if (!sessionId) {
    sessionId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, sessionId);
    } catch {
      // Storage access may be restricted in private browsing
    }
  }

  const endpointTrack = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/public/analytics/track`;
  const endpointHeartbeat = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/public/analytics/heartbeat`;

  // 3. Extract referrer & UTM parameters
  const referrer = document.referrer || 'Direct';
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source') || urlParams.get('ref') || undefined;

  const currentPath = window.location.pathname + (window.location.hash || '');
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const language = navigator.language || 'en-US';

  const startTime = Date.now();

  // 4. Send initial visit beacon asynchronously after idle/paint
  const sendInitialVisit = () => {
    try {
      const payload = {
        sessionId,
        path: currentPath,
        referrer,
        utmSource,
        screenResolution,
        language,
      };

      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(endpointTrack, blob);
      } else {
        fetch(endpointTrack, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking catch
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(sendInitialVisit, { timeout: 2000 });
  } else {
    setTimeout(sendInitialVisit, 500);
  }

  // 5. Track in-page section navigation (e.g. clicking #projects, #experience, #contact)
  const trackHashChange = () => {
    try {
      const sectionPath = window.location.pathname + (window.location.hash || '');
      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

      const payload = {
        sessionId,
        path: sectionPath,
        durationSeconds: elapsedSeconds,
      };

      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(endpointHeartbeat, blob);
      } else {
        fetch(endpointHeartbeat, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Ignore
    }
  };

  window.addEventListener('hashchange', trackHashChange, { passive: true });

  // 6. Active heartbeat timer while tab is visible (every 15 seconds)
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      const payload = {
        sessionId,
        path: window.location.pathname + (window.location.hash || ''),
        durationSeconds: elapsedSeconds,
      };

      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(endpointHeartbeat, blob);
      } else {
        fetch(endpointHeartbeat, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    }
  }, 15000);

  // 7. Track duration on page unload / tab hide
  const sendDurationBeacon = () => {
    try {
      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      if (elapsedSeconds < 1) return;

      const payload = {
        sessionId,
        path: window.location.pathname + (window.location.hash || ''),
        durationSeconds: elapsedSeconds,
      };

      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(endpointHeartbeat, blob);
      } else {
        fetch(endpointHeartbeat, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Ignore
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendDurationBeacon();
    }
  });

  window.addEventListener('pagehide', sendDurationBeacon);
}
