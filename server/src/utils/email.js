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
  const hasSmtpConfig = Boolean(
    (process.env.EMAIL_HOST || env.emailHost) &&
    (process.env.EMAIL_USER || env.emailUser) &&
    (process.env.EMAIL_PASS || env.emailPass)
  );

  // Prefer SMTP when configured so the app can send to any recipient address.
  if (hasSmtpConfig) {
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

  // Otherwise fall back to Resend.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = getResendClient();
      if (!resend || !resend.emails || typeof resend.emails.send !== 'function') {
        throw new Error('Resend client unavailable. Install `resend` or `@resend/node`.');
      }

      const from = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const toList = Array.isArray(to) ? to : [to];

      if (from === 'onboarding@resend.dev') {
        const allowedRecipient = process.env.RESEND_TEST_TO || process.env.EMAIL_FROM || '';
        if (allowedRecipient) {
          const normalizedAllowed = String(allowedRecipient).trim().toLowerCase();
          const allAllowed = toList.every(recipient => String(recipient).trim().toLowerCase() === normalizedAllowed);
          if (!allAllowed) {
            throw new Error('Resend onboarding sender can only email your verified test inbox. Set RESEND_FROM to a verified domain sender to email other recipients.');
          }
        }
      }

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
        to: toList,
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

  throw new Error('No email provider configured. Set SMTP credentials or RESEND_API_KEY.');
}

module.exports = { sendMail };
