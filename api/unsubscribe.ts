import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const SECRET       = process.env.RESEND_API_KEY ?? '';

function makeToken(userId: string): string {
  return crypto.createHmac('sha256', SECRET).update(userId).digest('hex').slice(0, 32);
}

function html(title: string, heading: string, body: string, cta?: { href: string; label: string }) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0d0d;padding:80px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;">
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="font-size:24px;font-weight:800;color:#1DB954;">TraderYo</div>
        </td></tr>
        <tr><td style="background:#181818;border-radius:20px;padding:40px 36px;border:1px solid rgba(255,255,255,0.07);text-align:center;">
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#ffffff;">${heading}</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#b3b3b3;line-height:1.7;">${body}</p>
          ${cta ? `<a href="${cta.href}" style="display:inline-block;background:#1DB954;color:#000000;text-decoration:none;font-weight:700;font-size:15px;padding:13px 32px;border-radius:999px;">${cta.label}</a>` : ''}
        </td></tr>
        <tr><td align="center" style="padding-top:28px;">
          <p style="margin:0;font-size:11px;color:#444444;"><a href="https://traderyo.com" style="color:#555555;text-decoration:none;">traderyo.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url  = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const uid  = url.searchParams.get('uid') ?? '';
  const tok  = url.searchParams.get('tok') ?? '';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!uid || !tok || tok !== makeToken(uid)) {
    res.writeHead(400);
    res.end(html(
      'קישור לא תקין',
      'הקישור אינו תקין',
      'הקישור שגוי או פג תוקפו. אם אתה מנסה להסיר את עצמך מרשימת הדיוור, אנא צור קשר ב-<a href="mailto:hello@traderyo.com" style="color:#1DB954;">hello@traderyo.com</a>',
    ));
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRK);
  const { error } = await supabase
    .from('profiles')
    .update({ email_unsubscribed: true })
    .eq('id', uid);

  if (error) {
    res.writeHead(500);
    res.end(html('שגיאה', 'משהו השתבש', 'נסה שוב מאוחר יותר או צור קשר ב-hello@traderyo.com'));
    return;
  }

  res.writeHead(200);
  res.end(html(
    'הוסרת מרשימת הדיוור',
    'הוסרת בהצלחה ✓',
    'לא תקבל יותר מיילים שיווקיים מ-TraderYo.<br>מיילים חיוניים הקשורים למנוי שלך עדיין יישלחו.',
    { href: 'https://traderyo.com/dashboard', label: 'חזור לדשבורד' },
  ));
}
