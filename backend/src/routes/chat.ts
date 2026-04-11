import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import Anthropic from '@anthropic-ai/sdk';
import type { ChatRequestBody, DOMElementSnapshot } from '../types.js';

export const chatRoute = new Hono();

const EXECUTOR_MODEL = 'claude-haiku-4-5-20251001';
const ADVISOR_MODEL = 'claude-opus-4-6';
const ADVISOR_BETA = 'advisor-tool-2026-03-01';

// Selector lines look like:  SELECTOR:[data-testid="foo"]
// They appear at the very end of Claude's response, one per line.
const SELECTOR_LINE_RE = /^SELECTOR:(.+)$/;

function buildSystemPrompt(siteName: string, siteContext?: string): string {
  return [
    'The advisor should respond in under 100 words and use enumerated steps, not explanations.',
    '',
    `Du bist ein freundlicher UI-Assistent für ${siteName}. Du hilfst Nutzern, sich auf der Website zurechtzufinden.`,
    '',
    'Du erhältst pro Frage:',
    '1. Einen Screenshot der aktuellen Seite (visueller Kontext, JPEG)',
    '2. Eine Liste aller sichtbaren DOM-Elemente mit CSS-Selektoren (struktureller Kontext)',
    '',
    'Regeln:',
    '- Antworte in der Sprache der Nutzerfrage. Genau EIN Schritt pro Antwort. Maximal 2 Sätze. Kein Markdown.',
    '- Wenn ein Element noch nicht sichtbar ist (falsche Seite), erkläre NUR den Navigationsschritt — kein SELECTOR für nicht-sichtbare Elemente.',
    '- Wenn eine Nutzernachricht mit „[CONTINUE]" beginnt, hat der Nutzer den vorherigen Schritt ausgeführt. Gib GENAU den nächsten Schritt ohne Einleitung.',
    '- Du hast Zugriff auf einen `advisor`-Tool. Nutze ihn nur bei wirklich komplexen Fragen.',
    '',
    'Element-Highlighting:',
    'Wenn du auf ein sichtbares Element verweist, füge am ENDE deiner Antwort (nach dem normalen Text, auf einer eigenen Zeile) folgendes ein:',
    'SELECTOR:<css-selector>',
    'Nutze exakt den Selektor aus der DOM-Liste. Maximal 1 SELECTOR-Zeile. Schreibe "SELECTOR:" immer als letztes.',
    'Wenn kein Element hervorgehoben werden soll (z.B. reine Erklärung, Element nicht sichtbar), schreibe: SELECTOR:none',
    '',
    'Beispiele:',
    'Klicke auf den Upgrade-Button oben rechts.',
    'SELECTOR:[data-testid="upgrade-plan-btn"]',
    '',
    'Gehe zuerst zu den Einstellungen (oben links im Menü).',
    'SELECTOR:none',
    ...(siteContext ? [
      '',
      'Zusätzlicher Kontext über diese Website (FAQ / Dokumentation):',
      siteContext,
    ] : []),
  ].join('\n');
}

function trimDomSnapshot(snapshot: DOMElementSnapshot[]): DOMElementSnapshot[] {
  return snapshot.slice(0, 150).map((el) => ({
    tag: el.tag,
    text: el.text?.slice(0, 80),
    selector: el.selector,
    ariaLabel: el.ariaLabel ?? undefined,
    role: el.role ?? undefined,
  }));
}

function buildUserContent(body: ChatRequestBody): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  const base64 = body.screenshot_base64.replace(/^data:image\/\w+;base64,/, '');
  if (base64) {
    blocks.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
    });
  }

  blocks.push({
    type: 'text',
    text: [
      `Aktuelle URL: ${body.current_url}`,
      `Seiten-Titel: ${body.page_title}`,
      '',
      'Sichtbare DOM-Elemente (JSON):',
      JSON.stringify(trimDomSnapshot(body.dom_snapshot), null, 2),
      '',
      `Nutzer-Frage: ${body.question}`,
    ].join('\n'),
  });

  return blocks;
}

/**
 * Splits a completed response text into visible text and CSS selectors.
 * SELECTOR: lines at the end are extracted; the rest is the display text.
 */
function extractSelectors(fullText: string): { text: string; selectors: string[] } {
  const lines = fullText.split('\n');
  const selectors: string[] = [];
  let cutAt = lines.length;

  for (let i = lines.length - 1; i >= 0; i--) {
    const m = SELECTOR_LINE_RE.exec(lines[i].trim());
    if (m) {
      selectors.unshift(m[1].trim());
      cutAt = i;
    } else if (lines[i].trim() === '') {
      // allow blank separator lines before selectors
      continue;
    } else {
      break;
    }
  }

  const text = lines.slice(0, cutAt).join('\n').trim();
  return { text, selectors };
}

chatRoute.post('/', async (c) => {
  let body: ChatRequestBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  if (!body.question?.trim()) {
    return c.json({ error: 'missing_question' }, 400);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'missing_anthropic_api_key' }, 500);
  }

  const client = new Anthropic({ apiKey });
  const siteName = body.site_name ?? 'this site';
  const system = buildSystemPrompt(siteName, body.site_context);

  const history: Anthropic.MessageParam[] = (body.conversation_history ?? []).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: 'user', content: buildUserContent(body) },
  ];

  return streamSSE(c, async (stream) => {
    let fullText = '';

    try {
      const response = client.beta.messages.stream(
        {
          model: EXECUTOR_MODEL,
          max_tokens: 512,
          system,
          messages,
          tools: [
            {
              type: 'advisor_20260301',
              name: 'advisor',
              model: ADVISOR_MODEL,
              max_uses: 1,
            } as unknown as Anthropic.ToolUnion,
          ],
          betas: [ADVISOR_BETA],
        } as Anthropic.Beta.MessageCreateParamsStreaming,
      );

      for await (const event of response) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          fullText += event.delta.text;
        } else if (
          event.type === 'content_block_start' &&
          event.content_block.type === 'server_tool_use'
        ) {
          await stream.writeSSE({ event: 'advisor', data: JSON.stringify({ status: 'thinking' }) });
        }
      }

      // Split text and selectors, send clean text then highlights
      const { text, selectors } = extractSelectors(fullText);

      if (text) {
        await stream.writeSSE({ event: 'text', data: JSON.stringify({ delta: text }) });
      }
      for (const sel of selectors.filter((s) => s !== 'none')) {
        await stream.writeSSE({ event: 'highlight', data: JSON.stringify({ selector: sel }) });
      }
      await stream.writeSSE({ event: 'done', data: '{}' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown_error';
      console.error('chat stream error:', message);
      await stream.writeSSE({ event: 'error', data: JSON.stringify({ message }) });
    }
  });
});
