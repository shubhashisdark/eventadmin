const nodemailer = require('nodemailer');
const env = require('../config/env');

function getResendClient() {
  const loaders = [
    () => require('resend'),
    () => require('@resend/node')
  ];

  for (const load of loaders) {
    try {
      const mod = load();
      const ResendCtor = mod?.Resend || mod?.default || mod;
      if (typeof ResendCtor === 'function') {
        return new ResendCtor(process.env.RESEND_API_KEY);
      }
    } catch (_) {
      // try the next package name
    }
  }

  return null;
}

function getTransport() {
  const host = process.env.EMAIL_HOST || env.emailHost || '';
  const port = Number(process.env.EMAIL_PORT || env.emailPort || 587);
  // allow override via EMAIL_SECURE=true (use TLS 465) or infer from port
  const secureFlag = (process.env.EMAIL_SECURE === 'true') || port === 465;

  const authUser = process.env.EMAIL_USER || env.emailUser || '';
  const authPass = process.env.EMAIL_PASS || env.emailPass || '';

  const options = {
    host,
    port,
    secure: secureFlag,
    auth: undefined
  };

  if (authUser && authPass) options.auth = { user: authUser, pass: authPass };

  // If no host is configured, this will let nodemailer default and fail clearly
  return nodemailer.createTransport(options);
}

async function sendMail({ to, subject, text, html, attachments = [] }) {
  // If RESEND_API_KEY is present, use Resend API (preferred for simple transactional sending)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = getResendClient();
      if (!resend || !resend.emails || typeof resend.emails.send !== 'function') {
        throw new Error('Resend client unavailable. Install `resend` or `@resend/node`.');
      }

      const from = process.env.RESEND_FROM || 'onboarding@resend.dev';

      // If attachments contain a data-url image (our QR), embed it in the html if possible
      let htmlToSend = html || '';
      if (attachments && attachments.length > 0) {
        // find first base64 image attachment and embed
        const img = attachments.find(a => a.content && a.encoding === 'base64');
        if (img) {
          const mime = img.contentType || 'image/png';
          const data = img.content;
          const dataUrl = `data:${mime};base64,${data}`;
          htmlToSend += `<p><img src=\"${dataUrl}\" width=\"300\"/></p>`;
        }
      }

      await resend.emails.send({
        from,
        to,
        subject,
        html: htmlToSend || text,
      });
      return { provider: 'resend' };
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      const e = new Error(`Resend send failed: ${message}`);
      e.original = err;
      throw e;
    }
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@example.com';
  const transport = getTransport();
  try {
    const info = await transport.sendMail({ from, to, subject, text, html, attachments });
    return info;
  } catch (err) {
    // normalize error for callers
    const message = err && err.response && err.response.message ? err.response.message : err.message || String(err);
    const e = new Error(`Failed to send email: ${message}`);
    e.original = err;
    throw e;
  }
}

module.exports = { sendMail };
