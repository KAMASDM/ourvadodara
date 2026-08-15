const nodemailer = require('nodemailer');

// Keep every transactional-email link on the canonical public domain. This is
// intentionally not environment-driven so an old deployment value cannot send
// customers to a retired hostname.
const APP_URL = 'https://ourcitymedia.in';
const BRAND_NAME = 'Our Vadodara';
const EMAIL_SECRET_NAMES = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];

let transporter;

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const cleanText = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const formatIndiaDate = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  }).format(date);
};

const formatMoney = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const getTransporter = () => {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) throw new Error('SMTP email service is not configured');
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000
  });
  return transporter;
};

const renderDetails = details => {
  const rows = Object.entries(details || {}).filter(([, value]) => value !== '' && value !== null && value !== undefined);
  if (!rows.length) return '';
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border:1px solid #e2e8f0;border-radius:14px;border-collapse:separate;overflow:hidden">${rows.map(([label, value], index) => `<tr><td style="padding:12px 14px;${index ? 'border-top:1px solid #e2e8f0;' : ''}color:#64748b;font-size:13px;width:38%">${escapeHtml(label)}</td><td style="padding:12px 14px;${index ? 'border-top:1px solid #e2e8f0;' : ''}color:#0f172a;font-size:13px;font-weight:700">${escapeHtml(value)}</td></tr>`).join('')}</table>`;
};

const renderEmail = ({ preheader, eyebrow = BRAND_NAME, title, greeting, paragraphs = [], details, cta, note }) => {
  const safeTitle = escapeHtml(title);
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title></head><body style="margin:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader || title)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 14px 45px rgba(15,23,42,.10)"><tr><td style="padding:24px 30px;background:linear-gradient(135deg,#0f172a,#047857);color:#fff"><table role="presentation" width="100%"><tr><td><div style="font-size:20px;font-weight:900;letter-spacing:-.02em">OUR VADODARA</div><div style="font-size:11px;color:#a7f3d0;margin-top:3px">Your city. Your stories.</div></td><td align="right"><div style="width:38px;height:38px;border-radius:12px;background:#fff;color:#047857;line-height:38px;text-align:center;font-weight:900">OV</div></td></tr></table></td></tr><tr><td style="padding:34px 30px 30px"><div style="font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#059669">${escapeHtml(eyebrow)}</div><h1 style="margin:9px 0 18px;font-size:28px;line-height:1.2;letter-spacing:-.025em;color:#0f172a">${safeTitle}</h1>${greeting ? `<p style="margin:0 0 15px;font-size:16px;line-height:1.7">${escapeHtml(greeting)}</p>` : ''}${paragraphs.map(paragraph => `<p style="margin:0 0 15px;font-size:15px;line-height:1.75;color:#334155">${escapeHtml(paragraph)}</p>`).join('')}${renderDetails(details)}${cta?.url && cta?.label ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0"><tr><td style="border-radius:12px;background:#059669"><a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:13px 20px;color:#fff;text-decoration:none;font-size:14px;font-weight:800">${escapeHtml(cta.label)}</a></td></tr></table>` : ''}${note ? `<div style="margin-top:22px;padding:14px 16px;border-radius:12px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.6">${escapeHtml(note)}</div>` : ''}</td></tr><tr><td style="padding:20px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:11px;line-height:1.6">This email was sent by ${BRAND_NAME}. For notification choices, visit <a href="${APP_URL}/notifications-settings" style="color:#047857">Notification settings</a>.<br>© ${new Date().getFullYear()} ${BRAND_NAME}</td></tr></table></td></tr></table></body></html>`;
};

const sendEmail = async ({ to, subject, html, text, replyTo }) => {
  const recipient = String(to || '').trim().toLowerCase();
  if (!recipient || !recipient.includes('@')) return { skipped: true, reason: 'missing_recipient' };
  const info = await getTransporter().sendMail({
    from: `"${BRAND_NAME}" <${process.env.SMTP_USER}>`,
    to: recipient,
    replyTo: replyTo || process.env.SMTP_USER,
    subject,
    html,
    text: text || cleanText(html)
  });
  return { sent: true, messageId: info.messageId, accepted: info.accepted };
};

const verifyEmailTransport = async () => getTransporter().verify();

const sendTemplatedEmail = async ({ to, subject, template, replyTo }) => sendEmail({
  to,
  subject,
  replyTo,
  html: renderEmail(template),
  text: [template.greeting, ...(template.paragraphs || []), ...Object.entries(template.details || {}).map(([key, value]) => `${key}: ${value}`), template.cta?.url].filter(Boolean).join('\n\n')
});

const sendBulkTemplatedEmail = async ({ recipients, subject, templateForRecipient, batchSize = 5 }) => {
  const uniqueRecipients = [...new Map((recipients || []).filter(item => item?.email).map(item => [item.email.toLowerCase(), item])).values()];
  const results = [];
  for (let index = 0; index < uniqueRecipients.length; index += batchSize) {
    const batch = uniqueRecipients.slice(index, index + batchSize);
    const batchResults = await Promise.allSettled(batch.map(recipient => sendTemplatedEmail({
      to: recipient.email,
      subject,
      template: templateForRecipient(recipient)
    })));
    results.push(...batchResults);
  }
  return { recipients: uniqueRecipients.length, sent: results.filter(result => result.status === 'fulfilled').length, failed: results.filter(result => result.status === 'rejected').length };
};

module.exports = {
  APP_URL,
  EMAIL_SECRET_NAMES,
  cleanText,
  formatIndiaDate,
  formatMoney,
  renderEmail,
  sendEmail,
  sendTemplatedEmail,
  sendBulkTemplatedEmail,
  verifyEmailTransport
};
