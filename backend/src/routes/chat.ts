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
    `You are a friendly UI assistant for ${siteName}. You help users navigate the website.`,
    '',
    'You receive per question:',
    '1. A screenshot of the current page (visual context, JPEG)',
    '2. A list of all visible DOM elements with CSS selectors (structural context)',
    '',
    'Rules:',
    '- Reply in English. Exactly ONE step per answer. Max 2 sentences. No markdown.',
    '- Only ONE action per step. Never combine "A and then B".',
    '- If the user says "What is the next step?": give the next step immediately.',
    '- If message starts with "[CONTINUE]": user navigated to a new page. Give next step based on new page.',
    '- If element is not visible (wrong page): explain only the navigation step, no SELECTOR.',
    '- Use advisor tool only for genuinely complex questions.',
    '',
    'At the END of every answer write exactly these two lines:',
    'SELECTOR:<selector-from-dom-list>',
    'CONTINUE:<value>',
    '',
    'CONTINUE values:',
    'CONTINUE:yes  = default. Use whenever more steps follow after this one.',
    'CONTINUE:no   = only when the user must navigate to a DIFFERENT page via sidebar/menu/link, AND more steps follow after.',
    'CONTINUE:done = only when the user\'s original goal is fully and completely accomplished — nothing left to do.',
    '',
    'CONTINUE:yes is the default. Only use :no or :done in the exact situations above.',
    'Buttons that open a form, modal or dropdown on the same page → always CONTINUE:yes.',
    'The final submit/save/confirm button of a multi-step flow → CONTINUE:done.',
    'If no element should be highlighted: SELECTOR:none',
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

  if (body.input_values && body.input_values.length > 0) {
    blocks.push({
      type: 'text',
      text: [
        '',
        'Currently filled form fields (user has already typed these):',
        JSON.stringify(body.input_values, null, 2),
        '',
        'IMPORTANT: These fields are already filled. Do NOT ask the user to fill them again.',
      ].join('\n'),
    });
  }

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
