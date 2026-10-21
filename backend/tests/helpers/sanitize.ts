/**
 * Guna CMS — Security Sanitization & Safe URL Handling
 * Enforces XSS mitigation on all dynamic CMS content rendering using DOMPurify.
 */
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Escapes characters that are special in HTML body context.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapes characters that are special in HTML attributes.
 */
export function escapeAttr(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

/**
 * Validates URLs against an explicit protocol allowlist.
 * Rejects javascript:, data:, vbscript:, and unexpected schemes or protocol tricks.
 */
export function sanitizeUrl(url: unknown, fallback = '#'): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();

  // Strip control chars, null bytes, and decode common entity tricks for protocol checking
  let normalized = trimmed.replace(/[\u0000-\u001F\u007F-\u009F\s]+/g, '').toLowerCase();

  // Normalize common entity encoded characters (e.g. colon, javascript)
  normalized = normalized
    .replace(/&#0*58;?/g, ':')
    .replace(/&#x0*3a;?/g, ':')
    .replace(/&colon;?/g, ':')
    .replace(/&tab;/g, '')
    .replace(/&newline;/g, '');

  if (
    normalized.includes('javascript:') ||
    normalized.includes('data:') ||
    normalized.includes('vbscript:') ||
    normalized.startsWith('//') ||
    normalized.startsWith('/\\')
  ) {
    return fallback;
  }

  // Allow safe fragment or relative URLs
  if (trimmed.startsWith('#') || (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\'))) {
    if (!/[\u0000-\u001F\u007F-\u009F]/.test(trimmed)) {
      return escapeAttr(trimmed);
    }
    return fallback;
  }

  try {
    const parsed = new URL(trimmed);
    if (ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      return escapeAttr(trimmed);
    }
  } catch {
    // If not a full URL and matches safe relative path
    if (/^[a-zA-Z0-9_\-./?&=%#]+$/.test(trimmed) && !trimmed.includes(':')) {
      return escapeAttr(trimmed);
    }
  }

  return fallback;
}

// Strict DOMPurify configuration for portfolio rich text
export const RICH_TEXT_PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'a',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
    'blockquote',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  ADD_ATTR: ['target'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#|_blank|_self|_parent|_top)/i,
  FORBID_TAGS: [
    'style',
    'script',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'svg',
    'math',
    'iframe',
    'link',
    'meta',
    'base',
    'template',
  ],
  FORBID_ATTR: [
    'style',
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onfocus',
    'onblur',
    'xlink:href',
    'action',
    'formaction',
  ],
};

let purifyInstance: any = null;

export function getPurifier(): any {
  if (purifyInstance) return purifyInstance;

  let win = (typeof window !== 'undefined' && window.document) ? window : (globalThis as any).jsdomWindow;
  if (!win) {
    try {
      const dom = new JSDOM('<!DOCTYPE html>');
      win = dom.window;
    } catch {
      win = null;
    }
  }

  if (win) {
    const factory = (DOMPurify as any).default || DOMPurify;
    purifyInstance = typeof factory === 'function' ? factory(win) : factory;
  }

  if (purifyInstance && typeof purifyInstance.addHook === 'function' && !purifyInstance._hooksAdded) {
    purifyInstance._hooksAdded = true;
    purifyInstance.addHook('afterSanitizeAttributes', (node: Element) => {
      if (node.tagName === 'A') {
        if (node.getAttribute('target') === '_blank') {
          node.setAttribute('rel', 'noopener noreferrer');
        }
        if (node.hasAttribute('href')) {
          const href = node.getAttribute('href') || '';
          const safe = sanitizeUrl(href, '');
          if (!safe) {
            node.removeAttribute('href');
          } else {
            node.setAttribute('href', safe);
          }
        }
      }
    });
  }

  return purifyInstance;
}

/**
 * Sanitizes rich text HTML using DOMPurify with a strict allowlist.
 * Guarantees output cannot introduce executable HTML through innerHTML.
 */
export function sanitizeRichText(dirtyHtml: unknown): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  const purifier = getPurifier();
  if (purifier && typeof purifier.sanitize === 'function') {
    return purifier.sanitize(dirtyHtml, RICH_TEXT_PURIFY_CONFIG);
  }

  // Extreme fallback: plain text escaping if purifier could not be initialized
  return escapeHtml(dirtyHtml);
}
