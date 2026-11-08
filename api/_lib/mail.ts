/**
 * Email through Resend's REST API (no SDK). hangar01.space is a verified
 * sending domain; mail to hi@hangar01.space is forwarded to the owner's inbox.
 */

export const INBOX = 'hi@hangar01.space';
const FROM = 'HANGAR01 <website@hangar01.space>';

// Light-theme colours from the site's tokens (src/index.css).
const C = {
  base: '#ffffff',
  surface: '#f5f5f5',
  border: '#d4d4d4',
  primary: '#111111',
  muted: '#525252',
  faint: '#6b6b6b',
  accent: '#3a6b8a',
};
const SANS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', Menlo, Consolas, monospace";

export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

export interface Note {
  subject: string;
  /** Small mono line above the heading, e.g. "Issue report #12". */
  kicker: string;
  heading: string;
  /** Label/value pairs. A value with an href renders as a link. */
  rows: { label: string; value: string; href?: string }[];
  message?: string;
  actions?: { label: string; href: string }[];
  replyTo?: string;
}

const when = () =>
  `${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date())} IST`;

function html(n: Note) {
  const rows = n.rows
    .map(
      (r) => `<tr>
        <td style="padding:7px 16px 7px 0;width:96px;vertical-align:top;font:500 11px/18px ${MONO};text-transform:uppercase;color:${C.faint}">${escapeHtml(r.label)}</td>
        <td style="padding:7px 0;vertical-align:top;font:400 15px/22px ${SANS};color:${C.primary}">${
          r.href
            ? `<a href="${escapeHtml(r.href)}" style="color:${C.accent};text-decoration:underline">${escapeHtml(r.value)}</a>`
            : escapeHtml(r.value)
        }</td>
      </tr>`,
    )
    .join('');

  const message = n.message
    ? `<div style="margin:24px 0 0;padding:16px 18px;background:${C.surface};border-left:3px solid ${C.accent};font:400 15px/24px ${SANS};color:${C.primary};white-space:pre-wrap">${escapeHtml(n.message)}</div>`
    : '';

  const actions = n.actions?.length
    ? `<div style="margin:28px 0 0">${n.actions
        .map(
          (a, i) =>
            `<a href="${escapeHtml(a.href)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 18px;font:500 14px/20px ${SANS};text-decoration:none;${
              i === 0
                ? `background:${C.accent};color:${C.base}`
                : `background:${C.surface};color:${C.primary};border:1px solid ${C.border}`
            }">${escapeHtml(a.label)}</a>`,
        )
        .join('')}</div>`
    : '';

  return `<!doctype html><html><body style="margin:0;padding:0;background:${C.surface}">
  <div style="padding:32px 16px">
    <div style="max-width:560px;margin:0 auto;background:${C.base};border:1px solid ${C.border};border-top:4px solid ${C.accent};padding:28px 28px 24px">
      <p style="margin:0 0 6px;font:500 11px/16px ${MONO};text-transform:uppercase;color:${C.faint}">HANGAR01 · ${escapeHtml(n.kicker)}</p>
      <h1 style="margin:0 0 20px;font:600 22px/28px ${SANS};color:${C.primary}">${escapeHtml(n.heading)}</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;border-top:1px solid ${C.border}">${rows}</table>
      ${message}
      ${actions}
    </div>
    <p style="max-width:560px;margin:14px auto 0;font:400 12px/18px ${SANS};color:${C.muted};text-align:center">Sent by hangar01.space · ${when()}</p>
  </div>
</body></html>`;
}

function text(n: Note) {
  return [
    n.heading,
    '',
    ...n.rows.map(
      (r) => `${r.label}: ${r.href && r.href !== r.value ? `${r.value} (${r.href})` : r.value}`,
    ),
    ...(n.message ? ['', n.message] : []),
    ...(n.actions?.length ? ['', ...n.actions.map((a) => `${a.label}: ${a.href}`)] : []),
    '',
    `Sent by hangar01.space · ${when()}`,
  ].join('\n');
}

/** Email a short, formatted note to the HANGAR01 inbox. Returns false on failure. */
export async function notify(n: Note): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: INBOX,
        reply_to: n.replyTo,
        subject: n.subject,
        html: html(n),
        text: text(n),
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) console.error('Resend failed:', res.status, await res.text());
    return res.ok;
  } catch (error) {
    console.error('Resend failed:', error);
    return false;
  }
}
