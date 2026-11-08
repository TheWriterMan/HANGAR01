# Reporting & Contact System

Reference doc for the contact form (Discord) and checklist issue reporting (GitHub issues, checked by a model, emailed to the inbox). **This system is fully implemented.**

Shared code lives in `api/_lib/submission.ts` (IP, rate limit, Discord delivery, handler flow). Validation rules and length limits live in `src/utils/validation.ts` and are used by both the browser forms and the functions.

**Contact request flow:** method check → validation → honeypot → rate limit → webhook env check → Discord send → count towards rate limit.

| Outcome                       | Status                                      |
| ----------------------------- | ------------------------------------------- |
| Not `POST`                    | 405                                         |
| Invalid input                 | 400 (does not count towards the rate limit) |
| Honeypot filled               | 200, nothing sent                           |
| Rate limited                  | 429                                         |
| Webhook env var missing       | 500                                         |
| Discord error or timeout (8s) | 502 (does not count towards the rate limit) |
| Delivered                     | 200                                         |

Discord payloads disable all mentions (`allowed_mentions: { parse: [] }`), put long text in the embed description (4,096 max) and cap field values at 1,024 characters. Client IP comes from `x-real-ip`.

---

## Architecture

```
┌──────────────┐        ┌──────────────────────────┐
│  React SPA   │──POST──│  Vercel Serverless Func  │
│  (Browser)   │        │  /api/contact.ts         │
│              │        │  /api/report.ts          │
└──────────────┘        └──────────────────────────┘
                                    │
            contact │ webhook (awaited)       report │ issue, then waitUntil
                    ▼                                ▼
            ┌──────────────┐            ┌────────────────────────────┐
            │   Discord    │            │ GitHub issue · Groq check  │
            │  (Contacts)  │            │ · Resend → hi@hangar01     │
            └──────────────┘            └────────────────────────────┘
```

**Important**: Discord webhooks are `await`-ed in the serverless function. Fire-and-forget (`sendDiscordNotification(data)` without `await`) causes the Vercel lambda to terminate before the fetch completes — Discord will never receive the notification.

---

## Security

Secrets are **server-side env vars only**, set in Vercel (production and preview), never in `.env` or client code.

| Variable                      | Purpose                                     |
| ----------------------------- | ------------------------------------------- |
| `DISCORD_CONTACT_WEBHOOK_URL` | Contact form → Discord Contacts channel     |
| `GITHUB_TOKEN`                | Opens and updates report issues             |
| `GROQ_API_KEY`                | Spam check for reports                      |
| `RESEND_API_KEY`              | Report emails from `website@hangar01.space` |

---

## 1. Contact Form (`/contact` → `ContactPage.tsx`)

**Fields:** Name (required, 2–100), Email (required, valid, max 254), Subject (required, 5–150), Message (required, 10–2000). The form uses `noValidate` so the custom accessible errors show instead of browser bubbles.

**Spam protection:** Hidden honeypot field + 30s/IP rate limiting in the serverless function.

**Backend** (`/api/contact.ts`):

1. Validate payload
2. Check honeypot + rate limit
3. Await Discord webhook embed → Contacts channel
4. Return `{ success: true }` or `{ error: "..." }`

---

## 2. Checklist Report Panel (`ReportPanel.tsx`)

**Trigger:** "Report Inaccuracy" button in `AircraftHeader.tsx` (one header for mobile and desktop).

**UI behaviour:**

- Mobile: slides up full-width from the bottom of the screen
- Desktop: anchors to bottom-right (`md:right-4 md:bottom-4 md:w-[28rem]`)
- Collapse/expand via chevron button in header
- No drag handle (removed — was intercepting page scroll)
- sessionStorage draft persistence keyed by `report_draft_<slug>`
- Draft clears on successful submission

**Fields:** Aircraft (auto-filled, read-only), Details (free text, max 2000), Email (optional, hidden behind "Add email" link)

**Backend** (`/api/report.ts`):

1. Validate payload (details 10–2000 chars on both client and server; slug must be kebab-case)
2. Check honeypot + rate limit
3. Look up the aircraft name from this deployment's `/content/checklists/<slug>.json` (unknown slug → 400)
4. Open a placeholder issue on `TheWriterMan/HANGAR01`, labelled `report` + `needs verification`, and return `{ success, issue, url }`. While the repo is private the link is left out and the panel just says thanks.
5. In the background (`waitUntil`), Groq checks the text (`openai/gpt-oss-safeguard-20b`, then `qwen/qwen3.8-27b`; prompt in `verifyPrompt()`):
   - **legit:** the issue gets the model's title and the report quoted; label becomes `report`
   - **spam:** closed as not planned, labelled `spam`, locked
   - **unsure** (or anything with personal details): stays pending for a person
6. Every report is emailed to `hi@hangar01.space` with the verdict; reply-to is the reporter. Their email never goes to GitHub.

The repo needs the labels `report`, `needs verification` and `spam`. Groq's free tier allows 3 requests a minute on the first model, so bursts fall back to the second.

---

## Spam Protection

- **Honeypot**: Hidden `_honeypot` input field. If filled, returns 200 silently (does not alert bots).
- **Rate limiting**: In-memory 30s/IP per Vercel instance. Only delivered submissions count; stale entries are evicted.
- **Cloudflare**: Domain is proxied through Cloudflare, providing WAF, bot challenge, and DDoS protection at the edge.
