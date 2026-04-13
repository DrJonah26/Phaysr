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
const SELECTOR_LINE_RE = /^SELECTOR:\s*(.+)$/;
const CONTINUE_LINE_RE = /^CONTINUE:\s*(yes|no|done)$/i;

function buildSystemPrompt(siteName: string, siteContext?: string): string {
  return [
    `You are a UI assistant for ${siteName}. Help users navigate the website step by step.`,
    '',
    'You receive:',
    '1. A screenshot of the current page',
    '2. A list of visible DOM elements with CSS selectors',
    '3. Currently filled form fields (if any)',
    '',
    'Rules:',
    '- ONE step per answer. Max 2 sentences. No markdown.',
    '- Only reference selectors from the DOM list.',
    '- If form fields are already filled, acknowledge this and move to the next step.',
    '- If element is not on current page, explain navigation only — no SELECTOR.',
    '',
    'End EVERY answer with exactly these two lines:',
    'SELECTOR:<selector-or-none>',
    'CONTINUE:<yes|no|done>',
    '',
    'CONTINUE values:',
    'yes  = more steps follow on this page',
    'no   = user must navigate to a different page first',
    'done = original goal is fully accomplished',
    ...(siteContext ? ['', 'Site context:', siteContext] : []),
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
      const { text, selectors, canContinue: rawCanContinue } = extractSelectors(fullText);
      let canContinue = rawCanContinue;

      // Only pass through selectors that actually exist in the DOM snapshot
      // — prevents hallucinated selectors from reaching the widget
      const domSelectors = new Set(body.dom_snapshot.map(el => el.selector));
      const validSelectors = selectors.filter(sel =>
        sel === 'none' || domSelectors.has(sel)
      );

      // Code-level task completion detection — catches cases where Claude
      // returns CONTINUE:yes but the response clearly signals task is done.
      // Does not rely on system-prompt instructions.
      if (canContinue === 'yes') {
        const noHighlight = validSelectors.every(s => s === 'none');
        const hasCompletionSignal = /\b(successfully|has been (complet|upgrad|submit|sav|sent|creat)|all set|you(?:'re| are) (?:now|all set)|fully accomplished)\b/i.test(text);
        const hasActionWord = /\b(click|tap|select|choose|type|enter|fill|navigate|go to|open|press|scroll)\b/i.test(text);
        if (noHighlight && hasCompletionSignal && !hasActionWord) {
          canContinue = 'done';
        }
      }

      if (text) {
        await stream.writeSSE({ event: 'text', data: JSON.stringify({ delta: text }) });
      }
      for (const sel of validSelectors.filter((s) => s !== 'none')) {
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
