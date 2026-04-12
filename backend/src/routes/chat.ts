import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import Anthropic from '@anthropic-ai/sdk';
import type { ChatRequestBody, DOMElementSnapshot } from '../types.js';

export const chatRoute = new Hono();

const EXECUTOR_MODEL = 'claude-haiku-4-5-20251001';
const ADVISOR_MODEL = 'claude-opus-4-6';
const ADVISOR_BETA = 'advisor-tool-2026-03-01';

// Selector lines look like:  SELECTOR:[data-testid="foo"]
// Continue lines look like:  CONTINUE:yes  or  CONTINUE:no
// Both appear at the very end of Claude's response, one per line.
const SELECTOR_LINE_RE = /^SELECTOR:(.+)$/;
const CONTINUE_LINE_RE = /^CONTINUE:(yes|no|done)$/;

function buildSystemPrompt(siteName: string, siteContext?: string): string {
  return [
    'The advisor should respond in under 100 words and use enumerated steps, not explanations.',
    '',
    `Du bist ein freundlicher UI-Assistent fur ${siteName}. Du hilfst Nutzern, sich auf der Website zurechtzufinden.`,
    '',
    'Du erhaltst pro Frage:',
    '1. Einen Screenshot der aktuellen Seite (visueller Kontext, JPEG)',
    '2. Eine Liste aller sichtbaren DOM-Elemente mit CSS-Selektoren (struktureller Kontext)',
    '',
    'Regeln:',
    '- Antworte in der Sprache der Nutzerfrage. Genau EIN Schritt pro Antwort. Maximal 2 Satze. Kein Markdown.',
    '- KRITISCH: Immer nur EINE einzige Aktion pro Schritt. Niemals "A und dann B" oder "A und wahle B" kombinieren. Wenn mehrere Aktionen notig sind, nenne nur die allererste.',
    '- Wenn ein Element noch nicht sichtbar ist (falsche Seite), erklare NUR den Navigationsschritt - kein SELECTOR fur nicht-sichtbare Elemente.',
    '- Wenn eine Nutzernachricht mit "[CONTINUE]" beginnt, hat der Nutzer eine Seitennavigation durchgefuhrt. Gib den nachsten Schritt basierend auf dem neuen Seitenzustand.',
    '- Wenn eine Nutzernachricht lautet "Erledigt. Was ist der nachste Schritt?", hat der Nutzer den vorherigen Schritt erledigt. Gib SOFORT den nachsten Schritt. Kommentiere NICHT was der Nutzer getan hat oder nicht getan hat.',
    '- Du hast Zugriff auf einen `advisor`-Tool. Nutze ihn nur bei wirklich komplexen Fragen.',
    '',
    'Element-Highlighting und Continue-Signal:',
    'Schreibe am ENDE deiner Antwort (nach dem normalen Text) immer zwei Zeilen:',
    'Zeile 1 - SELECTOR: SELECTOR:<css-selector>  (oder SELECTOR:none wenn kein Element)',
    'Zeile 2 - CONTINUE: CONTINUE:yes  wenn der Nutzer auf dieser Seite bleibt und danach noch ein weiterer Schritt folgt (Eingabefeld, Dropdown)',
    '          CONTINUE:no   wenn der Nutzer zu einer anderen Seite navigieren muss und danach noch Schritte folgen',
    '          CONTINUE:done wenn dieser Schritt der LETZTE Schritt des Auftrags ist (z.B. Formular absenden, Erstellen-Button, Bestatigen-Button) - egal ob danach eine Navigation kommt',
    'Nutze exakt den Selektor aus der DOM-Liste. Maximal 1 SELECTOR-Zeile.',
    '',
    'Beispiele:',
    'Klicke auf den Upgrade-Button oben rechts.',
    'SELECTOR:[data-testid="upgrade-plan-btn"]',
    'CONTINUE:yes',
    '',
    'Gehe zuerst zum Dashboard (linke Navigation).',
    'SELECTOR:none',
    'CONTINUE:no',
    '',
    'Klicke auf "Projekt erstellen" um das Projekt zu speichern.',
    'SELECTOR:[data-testid="create-project-btn"]',
    'CONTINUE:done',
    ...(siteContext ? [
      '',
      'Zusatzlicher Kontext uber diese Website (FAQ / Dokumentation):',
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
  const screenshotAvailable = base64.length > 0;

  if (screenshotAvailable) {
    blocks.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
    });
  }

  const domEmpty = !body.dom_snapshot || body.dom_snapshot.length === 0;

  blocks.push({
    type: 'text',
    text: [
      `Aktuelle URL: ${body.current_url}`,
      `Seiten-Titel: ${body.page_title}`,
      !screenshotAvailable ? 'Screenshot: nicht verfugbar (Rendering-Fehler auf dieser Seite — verlasse dich auf DOM-Elemente)' : '',
      domEmpty ? 'DOM-Elemente: keine sichtbaren Elemente erfasst (Seite moglicherweise noch im Aufbau)' : '',
      '',
      'Sichtbare DOM-Elemente (JSON):',
      JSON.stringify(trimDomSnapshot(body.dom_snapshot), null, 2),
      '',
      `Nutzer-Frage: ${body.question}`,
    ].filter(line => line !== '').join('\n'),
  });

  return blocks;
}

/**
 * Splits a completed response text into visible text and CSS selectors.
 * SELECTOR: lines at the end are extracted; the rest is the display text.
 */
function extractSelectors(fullText: string): { text: string; selectors: string[]; canContinue: 'yes' | 'no' | 'done' } {
  const lines = fullText.split('\n');
  const selectors: string[] = [];
  let canContinue: 'yes' | 'no' | 'done' = 'yes'; // default: show Continue
  let cutAt = lines.length;

  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    const sm = SELECTOR_LINE_RE.exec(trimmed);
    const cm = CONTINUE_LINE_RE.exec(trimmed);
    if (sm) {
      selectors.unshift(sm[1].trim());
      cutAt = i;
    } else if (cm) {
      canContinue = cm[1] as 'yes' | 'no' | 'done';
      cutAt = i;
    } else if (trimmed === '') {
      // allow blank separator lines before tags
      continue;
    } else {
      break;
    }
  }

  const text = lines.slice(0, cutAt).join('\n').trim();
  return { text, selectors, canContinue };
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
          (event as unknown as { content_block?: { type?: string } }).content_block?.type === 'server_tool_use'
        ) {
          await stream.writeSSE({ event: 'advisor', data: JSON.stringify({ status: 'thinking' }) });
        }
      }

      // Split text, selectors and continue-signal; send clean text then highlights
      const { text, selectors, canContinue } = extractSelectors(fullText);

      if (text) {
        await stream.writeSSE({ event: 'text', data: JSON.stringify({ delta: text }) });
      }
      for (const sel of selectors.filter((s) => s !== 'none')) {
        await stream.writeSSE({ event: 'highlight', data: JSON.stringify({ selector: sel }) });
      }
      await stream.writeSSE({ event: 'can_continue', data: JSON.stringify({ value: canContinue }) }); // 'yes' | 'no' | 'done'
      await stream.writeSSE({ event: 'done', data: '{}' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown_error';
      console.error('chat stream error:', message);
      await stream.writeSSE({ event: 'error', data: JSON.stringify({ message }) });
    }
  });
});
