import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

const WEBHOOK_SECRET  = process.env.WHOP_WEBHOOK_SECRET ?? '';
const SUPABASE_URL    = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_SRK    = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function sendJson(res: ServerResponse, body: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function verifySignature(rawBody: Buffer, headers: IncomingMessage['headers']): boolean {
  try {
    const msgId        = headers['webhook-id'] as string;
    const msgTimestamp = headers['webhook-timestamp'] as string;
    const msgSig       = headers['webhook-signature'] as string;
    if (!msgId || !msgTimestamp || !msgSig) return false;

    // Secret: strip ws_ prefix, hex-decode to bytes
    const secretBytes   = Buffer.from(WEBHOOK_SECRET.replace(/^ws_/, ''), 'hex');
    const signedContent = `${msgId}.${msgTimestamp}.${rawBody.toString()}`;
    const expected      = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

    // Header may contain multiple signatures: "v1,sig1 v1,sig2"
    const signatures = msgSig.split(' ');
    return signatures.some((s) => {
      const [scheme, provided] = s.split(',');
      if (scheme !== 'v1' || !provided) return false;
      try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
      } catch { return false; }
    });
  } catch { return false; }
}

async function findUserByEmail(supabase: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email === email) ?? null;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return sendJson(res, { error: 'Method not allowed' }, 405);

  const rawBody = await readRawBody(req);

  if (!verifySignature(rawBody, req.headers)) {
    console.error('[whop-webhook] Invalid signature');
    return sendJson(res, { error: 'Invalid signature' }, 401);
  }

  const payload = JSON.parse(rawBody.toString()) as {
    action: string;
    data: { id: string; user?: { email?: string }; plan?: string };
  };

  const { action, data } = payload;
  const email = data?.user?.email;

  if (!email) return sendJson(res, { ok: true, note: 'no email' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRK);
  const user = await findUserByEmail(supabase, email);

  if (!user) {
    // User hasn't signed up yet — will be applied on first login via email match
    console.log(`[whop-webhook] ${action} for ${email} — user not found yet`);
    return sendJson(res, { ok: true, note: 'user not registered yet' });
  }

  if (action === 'membership_activated') {
    await supabase.from('profiles').upsert(
      { id: user.id, subscription_status: 'active', whop_membership_id: data.id },
      { onConflict: 'id' },
    );
    console.log(`[whop-webhook] Activated: ${email}`);
  } else if (action === 'membership_deactivated') {
    await supabase.from('profiles').upsert(
      { id: user.id, subscription_status: 'expired', whop_membership_id: data.id },
      { onConflict: 'id' },
    );
    console.log(`[whop-webhook] Deactivated: ${email}`);
  }

  sendJson(res, { ok: true });
}
