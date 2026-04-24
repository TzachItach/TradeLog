import type { IncomingMessage, ServerResponse } from 'http';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';

function sendJson(res: ServerResponse, body: unknown, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
  });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'content-type' });
    res.end(); return;
  }
  if (req.method !== 'POST') { sendJson(res, { error: 'Method not allowed' }, 405); return; }
  if (!ANTHROPIC_API_KEY) { sendJson(res, { error: 'AI not configured' }, 503); return; }

  let body: { summary?: string; lang?: string };
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, { error: 'Invalid JSON' }, 400); return;
  }

  const { summary, lang } = body;
  if (!summary) { sendJson(res, { error: 'Missing summary' }, 400); return; }

  const isHe = lang === 'he';

  const systemPrompt = isHe
    ? `אתה מנתח מסחר מקצועי המתמחה בחוזים עתידיים (Futures).
קבל נתוני עסקאות של טריידר וספק ניתוח קצר, ממוקד ומעשי בעברית.
כתוב 3-4 משפטים בלבד. התמקד בדפוסים ברורים, חולשות שניתן לשפר, וטיפ אחד מעשי.
אל תכלול כותרות, נקודות או bullet points — רק פסקה אחת רציפה.
השתמש בשפה ישירה ומקצועית. אל תתחיל ב"בהתבסס על".`
    : `You are a professional futures trading analyst.
Receive trader data and provide a short, focused, actionable analysis in English.
Write 3-4 sentences only. Focus on clear patterns, improvable weaknesses, and one practical tip.
No headers, no bullet points — one continuous paragraph.
Use direct, professional language. Do not start with "Based on".`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: summary }],
      }),
    });

    clearTimeout(timer);

    if (!apiRes.ok) {
      const err = await apiRes.text();
      console.error('Anthropic error:', err);
      sendJson(res, { error: 'AI service error' }, 502); return;
    }

    const data = await apiRes.json() as { content: { type: string; text: string }[] };
    const insight = data.content?.find(c => c.type === 'text')?.text ?? '';
    sendJson(res, { insight });
  } catch (e: unknown) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('abort')) {
      sendJson(res, { error: 'AI request timed out' }, 504);
    } else {
      sendJson(res, { error: 'AI request failed' }, 502);
    }
  }
}
