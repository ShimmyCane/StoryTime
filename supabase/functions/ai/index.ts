// StoryTime — AI helper (Supabase Edge Function "ai")
// Holds the Gemini key so the browser never sees it. Called from js/ai.js.
// Deploy with JWT verification ON (the default): only a signed-in family login gets through.
//
// Replies are always HTTP 200 with { ok, data } or { ok: false, code, message },
// so js/ai.js can show the exact reason. Gateway-level 401 means "not signed in".

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Change the model with the GEMINI_MODEL secret, no redeploy needed.
const MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { ...CORS, 'Content-Type': 'application/json' } });

const fail = (code: string, message = '') => json({ ok: false, code, message });

// Turns the request from the page into a prompt for Gemini
function buildPrompt(req: any): { prompt: string; asJson: boolean } | null {
  const level = String(req.levelName || 'K');
  const reading = `The child's reading level is ${level}. Use simple words and short sentences for that level.`;
  const chinese = 'Simplified Chinese. Keep it warm and suitable for young children.';

  switch (req.action) {
    case 'ping':
      return { prompt: 'Reply with the single word OK.', asJson: false };

    case 'opening':
      return {
        asJson: true,
        prompt: `Write a short opening for a Chinese children's story. ${reading}
Story ingredients: ${req.dials}.
Write 2 or 3 sentences in ${chinese}
Return JSON only: {"zh": "the Chinese opening", "en": "an English translation"}`
      };

    case 'forks': {
      const shape = req.slider
        ? 'exactly 2 opposite ends of one slider, for example "a little" and "a lot"'
        : `exactly ${req.choices} short choices`;
      return {
        asJson: true,
        prompt: `A child is telling a Chinese story aloud. ${reading}
The story so far (most recent last):
${req.transcript}

Write one question about what happens next, with ${shape}.
Each choice is 2 to 6 words in ${chinese} Add a short English gloss in brackets.
Return JSON only: {"question": "...", "options": ["...", "..."]}`
      };
    }

    case 'critique':
      return {
        asJson: true,
        prompt: `You are a gentle reading coach for a family. ${reading}
This is a story a child told aloud (Chinese transcript):
${req.transcript}

Give 2 specific things the child did well, and 1 suggestion for next time. Keep each point to one short sentence in English.
Return JSON only: {"strengths": ["...", "..."], "suggestion": "..."}`
      };

    default:
      return null;
  }
}

// Maps Gemini's HTTP status to one of the codes js/ai.js explains to the family
function codeFor(status: number, text: string): string {
  if (status === 400 && /API key/i.test(text)) return 'BAD_KEY';
  if (status === 401) return 'BAD_KEY';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'MODEL';
  if (status === 429) return 'QUOTA';
  return 'UPSTREAM';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  let body: any;
  try { body = await req.json(); } catch { return fail('BAD_OUTPUT', 'Request was not JSON'); }

  // The service-role client bypasses RLS, which is the only way to read storytime_ai_key
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: row, error } = await admin
    .from('storytime_ai_key').select('api_key').eq('id', 1).maybeSingle();
  if (error) return fail('UPSTREAM', error.message);
  if (!row?.api_key) return fail('NO_KEY');

  const spec = buildPrompt(body);
  if (!spec) return fail('BAD_OUTPUT', `Unknown action: ${body.action}`);

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': row.api_key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: spec.prompt }] }],
        generationConfig: spec.asJson ? { responseMimeType: 'application/json' } : {}
      })
    });
  } catch (e) {
    return fail('NETWORK', String(e));
  }

  if (!res.ok) {
    const text = await res.text();
    return fail(codeFor(res.status, text), text.slice(0, 300));
  }

  const result = await res.json();
  const candidate = result.candidates?.[0];
  const text = (candidate?.content?.parts || []).map((p: any) => p.text || '').join('').trim();
  if (!text || ['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT'].includes(candidate?.finishReason)) {
    return fail('BLOCKED');
  }

  if (!spec.asJson) return json({ ok: true, data: text });

  try {
    return json({ ok: true, data: JSON.parse(text) });
  } catch {
    return fail('BAD_OUTPUT', text.slice(0, 300));
  }
});
