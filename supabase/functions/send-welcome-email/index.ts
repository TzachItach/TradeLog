import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function makeUnsubscribeToken(userId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(RESEND_API_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(userId));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function buildEmail(name: string, unsubscribeUrl: string): string {
  const firstName = name.split(' ')[0] || name;
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ברוכים הבאים ל-TraderYo</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0d0d;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <div style="display:inline-block;font-size:26px;font-weight:800;color:#1DB954;letter-spacing:-0.5px;">TraderYo</div>
              <div style="font-size:12px;color:#737373;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Smart Trading Journal</div>
            </td>
          </tr>

          <!-- Hero Card -->
          <tr>
            <td style="background:#181818;border-radius:20px;padding:40px 36px 36px;border:1px solid rgba(255,255,255,0.07);">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Tag -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <span style="display:inline-block;background:rgba(29,185,84,0.12);color:#1DB954;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:5px 12px;border-radius:999px;border:1px solid rgba(29,185,84,0.25);">ברוכים הבאים</span>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <h1 style="margin:0;font-size:30px;font-weight:700;color:#ffffff;line-height:1.25;">היי ${firstName} 👋</h1>
                  </td>
                </tr>

                <!-- Intro text -->
                <tr>
                  <td style="padding-bottom:36px;">
                    <p style="margin:0;font-size:15px;color:#b3b3b3;line-height:1.75;">
                      שמחים שהצטרפת ל-TraderYo — יומן המסחר החכם שנבנה עבור טריידרים רציניים.<br><br>
                      עכשיו יש לך כלי מקצועי לנהל, לנתח ולשפר את הביצועים שלך — בין אם אתה מסחר בחשבון פרטי, מנהל מספר חשבונות Prop Firm, או שניהם יחד.
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <div style="height:1px;background:rgba(255,255,255,0.07);"></div>
                  </td>
                </tr>

                <!-- Features -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <p style="margin:0 0 20px;font-size:12px;color:#737373;font-weight:600;letter-spacing:1px;text-transform:uppercase;">מה מחכה לך פנימה</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">

                      <tr>
                        <td style="padding-bottom:16px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width:40px;vertical-align:top;padding-top:2px;">
                                <div style="width:32px;height:32px;background:rgba(29,185,84,0.12);border-radius:8px;text-align:center;line-height:32px;font-size:16px;">📊</div>
                              </td>
                              <td style="padding-right:12px;">
                                <div style="font-size:14px;font-weight:600;color:#ffffff;margin-bottom:3px;">9 גרפי אנליטיקס מתקדמים</div>
                                <div style="font-size:13px;color:#737373;">עקומת הון, Drawdown, P&L לפי יום וסמל, Heatmap, ועוד</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding-bottom:16px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width:40px;vertical-align:top;padding-top:2px;">
                                <div style="width:32px;height:32px;background:rgba(29,185,84,0.12);border-radius:8px;text-align:center;line-height:32px;font-size:16px;">🏆</div>
                              </td>
                              <td style="padding-right:12px;">
                                <div style="font-size:14px;font-weight:600;color:#ffffff;margin-bottom:3px;">Prop Firm Tracker</div>
                                <div style="font-size:13px;color:#737373;">מעקב Drawdown, Daily Limit ויעד הרווח בזמן אמת</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding-bottom:16px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width:40px;vertical-align:top;padding-top:2px;">
                                <div style="width:32px;height:32px;background:rgba(29,185,84,0.12);border-radius:8px;text-align:center;line-height:32px;font-size:16px;">💼</div>
                              </td>
                              <td style="padding-right:12px;">
                                <div style="font-size:14px;font-weight:600;color:#ffffff;margin-bottom:3px;">ניהול עסקי</div>
                                <div style="font-size:13px;color:#737373;">עקוב אחר הוצאות, משיכות ורווחיות נטו לאורך זמן</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width:40px;vertical-align:top;padding-top:2px;">
                                <div style="width:32px;height:32px;background:rgba(29,185,84,0.12);border-radius:8px;text-align:center;line-height:32px;font-size:16px;">⚡</div>
                              </td>
                              <td style="padding-right:12px;">
                                <div style="font-size:14px;font-weight:600;color:#ffffff;margin-bottom:3px;">ייבוא אוטומטי</div>
                                <div style="font-size:13px;color:#737373;">חיבור ישיר ל-TopstepX ו-Tradovate — ללא הזנה ידנית</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:28px 0 32px;">
                    <div style="height:1px;background:rgba(255,255,255,0.07);"></div>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center">
                    <a href="https://traderyo.com/dashboard"
                       style="display:inline-block;background:#1DB954;color:#000000;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:999px;letter-spacing:0.2px;">
                      התחל עכשיו &larr;
                    </a>
                    <p style="margin:16px 0 0;font-size:12px;color:#555555;">
                      שאלות? כתוב לנו: <a href="mailto:hello@traderyo.com" style="color:#1DB954;text-decoration:none;">hello@traderyo.com</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:36px;">
              <p style="margin:0 0 8px;font-size:12px;color:#555555;">TraderYo &mdash; Smart Trading Journal</p>
              <p style="margin:0;font-size:11px;color:#444444;">
                קיבלת מייל זה כי נרשמת ל-TraderYo.
                <br>
                <a href="https://traderyo.com" style="color:#555555;text-decoration:none;">traderyo.com</a>
                &nbsp;&middot;&nbsp;
                <a href="${unsubscribeUrl}" style="color:#555555;text-decoration:none;">הסר מרשימת הדיוור</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  // Database webhooks send POST; ignore everything else
  if (req.method !== 'POST') {
    return new Response('ok', { status: 200 });
  }

  try {
    const payload = await req.json();

    // Only handle INSERT events on profiles
    if (payload.type !== 'INSERT' || !payload.record?.id) {
      return new Response('ignored', { status: 200 });
    }

    const userId = payload.record.id;

    // Look up the user's email + name via Supabase Admin REST API
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    });
    if (!userRes.ok) {
      console.error('Could not fetch user:', await userRes.text());
      return new Response('no user', { status: 200 });
    }
    const userData = await userRes.json();
    const email: string = userData.email;
    if (!email) return new Response('no email', { status: 200 });

    const name: string =
      userData.user_metadata?.full_name ||
      userData.user_metadata?.name ||
      email.split('@')[0];

    // Check if user has unsubscribed
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=email_unsubscribed`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    });
    const profiles = await profileRes.json();
    if (profiles?.[0]?.email_unsubscribed) {
      console.log('User unsubscribed, skipping email');
      return new Response('unsubscribed', { status: 200 });
    }

    const token = await makeUnsubscribeToken(userId);
    const unsubscribeUrl = `https://traderyo.com/api/unsubscribe?uid=${userId}&tok=${token}`;

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TraderYo <hello@traderyo.com>',
        to: [email],
        subject: `ברוכים הבאים ל-TraderYo, ${name.split(' ')[0]}! 🚀`,
        html: buildEmail(name, unsubscribeUrl),
      }),
    });

    const body = await res.json();
    console.log('Resend response:', res.status, body);

    return new Response(JSON.stringify({ ok: res.ok, id: body.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-welcome-email error:', err);
    return new Response('error', { status: 200 }); // always 200 so webhook doesn't retry
  }
});
