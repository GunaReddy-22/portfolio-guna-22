import { Request } from 'express';

export interface GeoLocationResult {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  lat?: number;
  lon?: number;
}

export interface UserAgentResult {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot';
  browser: string;
  browserVersion: string;
  os: string;
  isBot: boolean;
}

// In-memory cache for IP -> Geolocation (24-hour expiration)
const geoCache = new Map<string, { result: GeoLocationResult; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 5000;

export function extractClientIp(req: Request): string {
  // 1. Cloudflare connecting IP
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) {
    return cleanIp(cfIp.trim());
  }

  // 2. Standard X-Forwarded-For (take the first client IP)
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const first = forwarded.split(',')[0].trim();
    if (first) return cleanIp(first);
  }

  // 3. Real IP header
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return cleanIp(realIp.trim());
  }

  // 4. Express req.ip or socket
  const fallback = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  return cleanIp(fallback);
}

function cleanIp(ip: string): string {
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }
  return ip;
}

export function isLocalOrPrivateIp(ip: string): boolean {
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
  ) {
    return true;
  }
  return false;
}

export async function resolveGeoLocation(
  ip: string,
  headers: Record<string, any> = {}
): Promise<GeoLocationResult> {
  // 1. Check Cloudflare geolocation headers
  const cfCountry = headers['cf-ipcountry'];
  const cfCity = headers['cf-ipcity'];
  const cfRegion = headers['cf-region'];

  if (cfCountry && typeof cfCountry === 'string' && cfCountry !== 'XX') {
    return {
      country: countryCodeToName(cfCountry) || cfCountry,
      countryCode: cfCountry.toUpperCase(),
      region: typeof cfRegion === 'string' ? cfRegion : 'Unknown',
      city: typeof cfCity === 'string' ? decodeURIComponent(cfCity) : 'Unknown',
      isp: 'Cloudflare Network',
    };
  }

  // 2. Handle Localhost / Internal IP
  if (isLocalOrPrivateIp(ip)) {
    return {
      country: 'Local Network',
      countryCode: 'IN',
      region: 'Internal',
      city: 'Localhost',
      isp: 'Development / Loopback',
    };
  }

  // 3. Check memory cache
  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  // 4. Resolve via ip-api.com with strict timeout (1.2 seconds)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,lat,lon,isp`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.status === 'success') {
        const result: GeoLocationResult = {
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'XX',
          region: data.regionName || 'Unknown',
          city: data.city || 'Unknown',
          isp: data.isp || '',
          lat: typeof data.lat === 'number' ? data.lat : undefined,
          lon: typeof data.lon === 'number' ? data.lon : undefined,
        };

        if (geoCache.size > MAX_CACHE_SIZE) {
          geoCache.clear();
        }
        geoCache.set(ip, { result, expiresAt: Date.now() + CACHE_TTL_MS });
        return result;
      }
    }
  } catch (_err) {
    // Graceful fallback on network timeout or offline
  }

  // Default fallback
  const fallbackResult: GeoLocationResult = {
    country: 'Unknown',
    countryCode: 'XX',
    region: 'Unknown',
    city: 'Unknown',
    isp: '',
  };
  return fallbackResult;
}

export function parseUserAgent(uaString: string = ''): UserAgentResult {
  const ua = uaString.toLowerCase();

  // 1. Bot Detection
  const botPatterns = [
    'bot',
    'crawl',
    'spider',
    'slurp',
    'googlebot',
    'bingbot',
    'yandex',
    'baidu',
    'duckduckbot',
    'headlesschrome',
    'lighthouse',
    'python-requests',
    'curl',
    'wget',
    'postman',
    'uptime',
  ];
  const isBot = botPatterns.some((pattern) => ua.includes(pattern));

  // 2. Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' = 'desktop';
  if (isBot) {
    deviceType = 'bot';
  } else if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|windows phone/i.test(ua)) {
    deviceType = 'mobile';
  }

  // 3. Operating System
  let os = 'Unknown';
  if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x') || ua.includes('macintosh')) os = 'macOS';
  else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) os = 'iOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('cros')) os = 'ChromeOS';

  // 4. Browser Detection
  let browser = 'Unknown';
  let browserVersion = '';

  if (ua.includes('edg/')) {
    browser = 'Edge';
    browserVersion = ua.split('edg/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browser = 'Chrome';
    browserVersion = ua.split('chrome/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Safari';
    browserVersion = ua.split('version/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox';
    browserVersion = ua.split('firefox/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera';
  }

  return {
    deviceType,
    browser,
    browserVersion: browserVersion.split('.')[0] || '',
    os,
    isBot,
  };
}

export function parseReferrerSource(
  referrer: string = '',
  utmSource?: string
): 'direct' | 'linkedin' | 'github' | 'google' | 'twitter' | 'resume' | 'other' {
  const ref = (referrer || '').toLowerCase();
  const utm = (utmSource || '').toLowerCase();

  if (utm.includes('resume') || utm.includes('cv') || ref.includes('resume') || ref.includes('cv')) {
    return 'resume';
  }
  if (ref.includes('linkedin.com') || ref.includes('lnkd.in') || utm.includes('linkedin')) {
    return 'linkedin';
  }
  if (ref.includes('github.com') || utm.includes('github')) {
    return 'github';
  }
  if (ref.includes('google.') || utm.includes('google')) {
    return 'google';
  }
  if (ref.includes('twitter.com') || ref.includes('t.co') || ref.includes('x.com') || utm.includes('twitter')) {
    return 'twitter';
  }
  if (!ref || ref === 'direct' || ref.includes('gunasai.in') || ref.includes('localhost')) {
    return 'direct';
  }
  return 'other';
}

function countryCodeToName(code: string): string {
  const map: Record<string, string> = {
    IN: 'India',
    US: 'United States',
    GB: 'United Kingdom',
    CA: 'Canada',
    DE: 'Germany',
    FR: 'France',
    AU: 'Australia',
    SG: 'Singapore',
    JP: 'Japan',
    AE: 'United Arab Emirates',
    NL: 'Netherlands',
  };
  return map[code.toUpperCase()] || code;
}
