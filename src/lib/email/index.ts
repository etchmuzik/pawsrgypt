/**
 * Transactional email transport.
 *
 * Resolves at runtime based on env vars:
 *   - RESEND_API_KEY set  → send via Resend (https://resend.com)
 *   - otherwise           → log-only (safe no-op in dev + environments
 *                           without email credentials configured)
 *
 * To add another provider (SendGrid, Postmark, SMTP), implement a new
 * transport that matches the `EmailTransport` contract and switch on an
 * env flag.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

interface EmailTransport {
  send(msg: EmailMessage): Promise<EmailResult>;
  name: string;
}

const DEFAULT_FROM = "PAWS Egypt <hello@pawsegypt.com>";

const logTransport: EmailTransport = {
  name: "log",
  async send(msg) {
    // eslint-disable-next-line no-console
    console.log(
      `[email:log] to=${msg.to} subject=${JSON.stringify(msg.subject)}`
    );
    return { ok: true, id: "log-only" };
  },
};

const resendTransport = (apiKey: string): EmailTransport => ({
  name: "resend",
  async send(msg) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: msg.from ?? DEFAULT_FROM,
          to: [msg.to],
          subject: msg.subject,
          html: msg.html,
          reply_to: msg.replyTo,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        return { ok: false, error: `resend ${res.status}: ${error}` };
      }

      const body = (await res.json()) as { id?: string };
      return { ok: true, id: body.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `resend: ${message}` };
    }
  },
});

let cached: EmailTransport | null = null;

export function getTransport(): EmailTransport {
  if (cached) return cached;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    cached = resendTransport(resendKey);
  } else {
    cached = logTransport;
  }
  return cached;
}

/**
 * Send an email via the configured transport.
 * Never throws — returns `{ ok: false, error }` on failure so callers can
 * decide whether email failures should block their flow (typically they
 * shouldn't — order creation must succeed even if email delivery fails).
 */
export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const transport = getTransport();
  return transport.send(msg);
}
