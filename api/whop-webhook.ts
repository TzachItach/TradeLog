import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

const WEBHOOK_SECRET  = process.env.WHOP_WEBHOOK_SECRET ?? '';
const SUPABASE_URL    = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_SRK    = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const RESEND_API_KEY  = process.env.RESEND_API_KEY ?? '';

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

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'TraderYo <hello@traderyo.com>', to: [to], subject, html }),
  });
}

function buildActivatedEmail(email: string): string {
  const name = email.split('@')[0];
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0d0d;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
        <tr><td align="center" style="padding-bottom:40px;">
          <div style="font-size:26px;font-weight:800;color:#1DB954;">TraderYo</div>
          <div style="font-size:12px;color:#737373;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Smart Trading Journal</div>
        </td></tr>
        <tr><td style="background:#181818;border-radius:20px;padding:40px 36px;border:1px solid rgba(255,255,255,0.07);">
          <span style="display:inline-block;background:rgba(29,185,84,0.12);color:#1DB954;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:5px 12px;border-radius:999px;border:1px solid rgba(29,185,84,0.25);margin-bottom:20px;">המנוי פעיל ✓</span>
          <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#ffffff;">ברוך הבא ל-TraderYo Pro! 🎉</h1>
          <p style="margin:0 0 32px;font-size:15px;color:#b3b3b3;line-height:1.75;">
            היי ${name},<br><br>
            המנוי שלך הופעל בהצלחה — יש לך גישה מלאה לכל הפיצ'רים של TraderYo:<br>
            אנליטיקס מתקדם, Prop Firm Tracker, ניהול עסקי, ייבוא אוטומטי ועוד.
          </p>
          <div style="height:1px;background:rgba(255,255,255,0.07);margin-bottom:32px;"></div>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
            <tr><td style="padding-bottom:14px;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width:36px;"><div style="width:28px;height:28px;background:rgba(29,185,84,0.12);border-radius:6px;text-align:center;line-height:28px;font-size:14px;">📊</div></td>
                <td style="padding-right:10px;"><div style="font-size:14px;color:#ffffff;font-weight:600;">9 גרפי אנליטיקס מתקדמים</div></td>
              </tr></table>
            </td></tr>
            <tr><td style="padding-bottom:14px;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width:36px;"><div style="width:28px;height:28px;background:rgba(29,185,84,0.12);border-radius:6px;text-align:center;line-height:28px;font-size:14px;">🏆</div></td>
                <td style="padding-right:10px;"><div style="font-size:14px;color:#ffffff;font-weight:600;">Prop Firm Tracker מלא</div></td>
              </tr></table>
            </td></tr>
            <tr><td>
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width:36px;"><div style="width:28px;height:28px;background:rgba(29,185,84,0.12);border-radius:6px;text-align:center;line-height:28px;font-size:14px;">⚡</div></td>
                <td style="padding-right:10px;"><div style="font-size:14px;color:#ffffff;font-weight:600;">ייבוא אוטומטי מ-TopstepX ו-Tradovate</div></td>
              </tr></table>
            </td></tr>
          </table>
          <div style="text-align:center;">
            <a href="https://traderyo.com/dashboard" style="display:inline-block;background:#1DB954;color:#000000;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:999px;">כנס לדשבורד &larr;</a>
          </div>
        </td></tr>
        <tr><td align="center" style="padding-top:32px;">
          <p style="margin:0;font-size:11px;color:#444444;">TraderYo &mdash; <a href="https://traderyo.com" style="color:#555555;text-decoration:none;">traderyo.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildExpiredEmail(email: string): string {
  const name = email.split('@')[0];
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0d0d;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
        <tr><td align="center" style="padding-bottom:40px;">
          <div style="font-size:26px;font-weight:800;color:#1DB954;">TraderYo</div>
          <div style="font-size:12px;color:#737373;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Smart Trading Journal</div>
        </td></tr>
        <tr><td style="background:#181818;border-radius:20px;padding:40px 36px;border:1px solid rgba(255,255,255,0.07);">
          <span style="display:inline-block;background:rgba(233,20,41,0.12);color:#ff4d60;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:5px 12px;border-radius:999px;border:1px solid rgba(233,20,41,0.25);margin-bottom:20px;">המנוי פג</span>
          <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#ffffff;">המנוי שלך הסתיים</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#b3b3b3;line-height:1.75;">
            היי ${name},<br><br>
            המנוי שלך ל-TraderYo הסתיים. הנתונים שלך שמורים ומחכים לך — רק חדש את המנוי כדי לקבל גישה מלאה מחדש.
          </p>
          <div style="background:rgba(29,185,84,0.06);border:1px solid rgba(29,185,84,0.15);border-radius:12px;padding:20px 24px;margin-bottom:32px;">
            <div style="font-size:13px;color:#b3b3b3;margin-bottom:4px;">המשך לסחור חכם</div>
            <div style="font-size:15px;color:#ffffff;font-weight:600;">$24.99 / חודש — כל הפיצ'רים, ביטול בכל עת</div>
          </div>
          <div style="text-align:center;">
            <a href="https://whop.com/checkout/plan_prXodSeim1jYH/" style="display:inline-block;background:#1DB954;color:#000000;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:999px;">חדש מנוי &larr;</a>
          </div>
          <p style="margin:24px 0 0;font-size:13px;color:#555555;text-align:center;">הנתונים שלך שמורים ומחכים לך</p>
        </td></tr>
        <tr><td align="center" style="padding-top:32px;">
          <p style="margin:0;font-size:11px;color:#444444;">TraderYo &mdash; <a href="https://traderyo.com" style="color:#555555;text-decoration:none;">traderyo.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
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
    await sendEmail(email, 'המנוי שלך ב-TraderYo הופעל! 🎉', buildActivatedEmail(email));
    console.log(`[whop-webhook] Activated: ${email}`);
  } else if (action === 'membership_deactivated') {
    await supabase.from('profiles').upsert(
      { id: user.id, subscription_status: 'expired', whop_membership_id: data.id },
      { onConflict: 'id' },
    );
    await sendEmail(email, 'המנוי שלך ב-TraderYo הסתיים', buildExpiredEmail(email));
    console.log(`[whop-webhook] Deactivated: ${email}`);
  }

  sendJson(res, { ok: true });
}
