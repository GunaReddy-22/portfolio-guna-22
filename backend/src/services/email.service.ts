import { env, isProduction } from '../config/env.js';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export { escapeHtml };

/**
 * Real Email Delivery Service
 *
 * Requirements:
 * - Real provider request executed before reporting successful delivery.
 * - In production, rejects unconfigured or console adapters.
 * - In development, console adapter logs ONLY recipient & subject, never sensitive tokens or bodies.
 * - Safe diagnostics logged without disclosing secrets or credentials.
 * - Untrusted text escaped in HTML output.
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<EmailResult> {
  const provider = (process.env.EMAIL_PROVIDER || (env as any).EMAIL_PROVIDER || 'console').toLowerCase();
  const apiKey = (
    provider === 'brevo'
      ? process.env.BREVO_API_KEY || (env as any).BREVO_API_KEY || process.env.EMAIL_API_KEY || env.EMAIL_API_KEY || ''
      : process.env.EMAIL_API_KEY || env.EMAIL_API_KEY || ''
  ).trim();
  const from = process.env.EMAIL_FROM || (env as any).EMAIL_FROM || process.env.EMAIL_USER || 'noreply.dev.guna@gmail.com';

  // 1. Production Safety Check: Console provider prohibited in production
  const isProd = env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
  if (provider === 'console') {
    if (isProd) {
      console.error('[Email] ❌ Delivery failed: Console email adapter is prohibited in production.');
      return { success: false, error: 'Console email provider prohibited in production' };
    }

    // Explicit development / test adapter: Safe diagnostic without leaking tokens or body
    console.log(`[Email Dev Adapter] Dispatched notification to: ${to} | Subject: "${subject}"`);
    return { success: true, messageId: `dev-${Date.now()}` };
  }

  // 2. Direct SMTP Provider Integration (e.g. Gmail or custom relay)
  if (provider === 'smtp') {
    try {
      const user = process.env.EMAIL_USER || '';
      const pass = process.env.EMAIL_PASS || '';
      if (!user || !pass) {
        console.error('[Email] ❌ Delivery failed: Missing EMAIL_USER or EMAIL_PASS for SMTP provider.');
        return { success: false, error: 'Missing SMTP credentials (EMAIL_USER/EMAIL_PASS)' };
      }

      const host = process.env.SMTP_HOST || (user.includes('gmail') ? 'smtp.gmail.com' : 'smtp.brevo.com');
      const port = parseInt(process.env.SMTP_PORT || (user.includes('gmail') ? '465' : '587'), 10);
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from: `"${process.env.EMAIL_SENDER_NAME || 'Guna CMS'}" <${from}>`,
        to,
        subject,
        text,
        html: html || `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('[Email] ❌ SMTP delivery failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  // 3. Validate API Key for external API providers
  if (!apiKey || apiKey.trim() === '') {
    console.error(`[Email] ❌ Delivery failed: Missing API key for email provider '${provider}'.`);
    return { success: false, error: `Missing API key for provider ${provider}` };
  }

  // 4. Resend Provider Integration
  if (provider === 'resend') {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
          html: html || undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as any;
      if (response.ok && data?.id) {
        return { success: true, messageId: data.id };
      }

      console.error(
        `[Email] ❌ Resend API returned error (HTTP ${response.status}): ${data?.message || 'Unknown error'}`
      );
      return { success: false, error: data?.message || `HTTP ${response.status}` };
    } catch (err: any) {
      console.error('[Email] ❌ Network error contacting Resend API:', err.message);
      return { success: false, error: err.message };
    }
  }

  // 5. SendGrid Provider Integration
  if (provider === 'sendgrid') {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from },
          subject,
          content: [
            { type: 'text/plain', value: text },
            ...(html ? [{ type: 'text/html', value: html }] : []),
          ],
        }),
      });

      if (response.status === 202 || response.ok) {
        const messageId = response.headers.get('x-message-id') || `sg-${Date.now()}`;
        return { success: true, messageId };
      }

      const errBody = await response.text().catch(() => '');
      console.error(`[Email] ❌ SendGrid returned HTTP ${response.status}: ${errBody.slice(0, 100)}`);
      return { success: false, error: `SendGrid HTTP ${response.status}` };
    } catch (err: any) {
      console.error('[Email] ❌ Network error contacting SendGrid API:', err.message);
      return { success: false, error: err.message };
    }
  }

  // 6. Brevo (Sendinblue) Provider Integration
  if (provider === 'brevo') {
    try {
      const senderName = process.env.EMAIL_SENDER_NAME || 'Guna CMS';
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: from },
          to: [{ email: to }],
          subject,
          textContent: text,
          htmlContent: html || `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as any;
      if (response.ok && (data?.messageId || response.status === 201)) {
        return { success: true, messageId: data?.messageId || `brevo-${Date.now()}` };
      }

      console.error(
        `[Email] ❌ Brevo API returned error (HTTP ${response.status}): ${data?.message || 'Unknown error'}`
      );
      return { success: false, error: data?.message || `HTTP ${response.status}` };
    } catch (err: any) {
      console.error('[Email] ❌ Network error contacting Brevo API:', err.message);
      return { success: false, error: err.message };
    }
  }

  // 7. Unsupported Provider
  console.error(`[Email] ❌ Unsupported email provider configured: '${provider}'.`);
  return { success: false, error: `Unsupported email provider '${provider}'` };
}
