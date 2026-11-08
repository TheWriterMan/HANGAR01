/**
 * Shared plumbing for the form endpoints (`api/contact.ts`, `api/report.ts`):
 * client IP, rate limiting, input coercion, and Discord delivery for contact.
 *
 * Files under `api/_lib/` are not deployed as functions (Vercel skips paths
 * that start with an underscore).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Client IP ───────────────────────────────────────────────────────────────

function firstHeader(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(',')[0]?.trim() || undefined;
}

/** Vercel sets `x-real-ip` to the client address; the rest are local fallbacks. */
export function getClientIp(req: VercelRequest): string {
  return (
    firstHeader(req.headers['x-real-ip']) ??
    firstHeader(req.headers['x-forwarded-for']) ??
    req.socket?.remoteAddress ??
    'unknown'
  );
}

// ─── Rate limiting (in-memory, per function instance) ────────────────────────

export interface RateLimiter {
  /** True when this IP sent an accepted submission inside the window. */
  isLimited(ip: string): boolean;
  /** Count an accepted submission against this IP. */
  record(ip: string): void;
}

export function createRateLimiter(windowMs: number, maxEntries = 5_000): RateLimiter {
  // Map keeps insertion order. `record` deletes before setting, so entries stay
  // sorted oldest → newest and eviction can stop at the first fresh one.
  const lastSeen = new Map<string, number>();

  function evict(now: number) {
    for (const [ip, ts] of lastSeen) {
      if (now - ts < windowMs && lastSeen.size <= maxEntries) break;
      lastSeen.delete(ip);
    }
  }

  return {
    isLimited(ip) {
      const now = Date.now();
      evict(now);
      const last = lastSeen.get(ip);
      return last !== undefined && now - last < windowMs;
    },
    record(ip) {
      lastSeen.delete(ip);
      lastSeen.set(ip, Date.now());
      evict(Date.now());
    },
  };
}

// ─── Input coercion ──────────────────────────────────────────────────────────

export function readBody(req: VercelRequest): Record<string, unknown> {
  const body: unknown = req.body;
  return typeof body === 'object' && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

/** Returns the value when it is a string, otherwise an empty string. */
export function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// ─── Discord ─────────────────────────────────────────────────────────────────

/** Discord embed limits: https://discord.com/developers/docs/resources/message#embed-object-embed-limits */
const LIMIT_TITLE = 256;
const LIMIT_DESCRIPTION = 4096;
const LIMIT_FIELD_NAME = 256;
const LIMIT_FIELD_VALUE = 1024;

export function clip(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface Embed {
  title: string;
  color: number;
  description?: string;
  fields: EmbedField[];
}

export type SendResult = { ok: true } | { ok: false; reason: string };

export async function sendDiscordEmbed(webhookUrl: string, embed: Embed): Promise<SendResult> {
  const payload = {
    // User input must never ping @everyone, roles or users.
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: clip(embed.title, LIMIT_TITLE),
        color: embed.color,
        description: embed.description ? clip(embed.description, LIMIT_DESCRIPTION) : undefined,
        fields: embed.fields.map((f) => ({
          name: clip(f.name, LIMIT_FIELD_NAME),
          value: clip(f.value || 'N/A', LIMIT_FIELD_VALUE),
          inline: f.inline,
        })),
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return { ok: false, reason: `Discord responded ${res.status}` };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Handler scaffold ────────────────────────────────────────────────────────

export interface SubmissionConfig<T> {
  /** Env var that holds the Discord webhook URL. */
  webhookEnv: string;
  limiter: RateLimiter;
  /** Returns the parsed payload, or an error message for the user. */
  validate(body: Record<string, unknown>): { data: T } | { error: string };
  toEmbed(data: T): Embed;
  failureMessage: string;
}

/**
 * Order matters:
 * 1. method → 2. validation → 3. honeypot → 4. rate limit → 5. send → 6. record.
 * Only accepted, delivered submissions count towards the limit, so a typo or a
 * Discord outage never locks a real user out.
 */
export async function handleSubmission<T>(
  req: VercelRequest,
  res: VercelResponse,
  config: SubmissionConfig<T>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = readBody(req);
  const result = config.validate(body);
  if ('error' in result) {
    return res.status(400).json({ error: result.error });
  }

  // Honeypot filled → silently succeed so bots get no signal.
  if (str(body._honeypot).trim()) {
    return res.status(200).json({ success: true });
  }

  const ip = getClientIp(req);
  if (config.limiter.isLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait 30 seconds.' });
  }

  const webhookUrl = process.env[config.webhookEnv];
  if (!webhookUrl) {
    console.error(`${config.webhookEnv} is not set`);
    return res.status(500).json({ error: config.failureMessage });
  }

  const sent = await sendDiscordEmbed(webhookUrl, config.toEmbed(result.data));
  if (!sent.ok) {
    console.error('Discord notification failed:', sent.reason);
    return res.status(502).json({ error: config.failureMessage });
  }

  config.limiter.record(ip);
  return res.status(200).json({ success: true });
}
