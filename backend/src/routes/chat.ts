import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import Anthropic from '@anthropic-ai/sdk';
import type { ChatRequestBody, DOMElementSnapshot } from '../types.js';
import { supabase } from '../db.js';
import type { UserRow } from '../db.js';
import { findProjectByApiKey } from './projects.js';

export const chatRoute = new Hono();

// --- Jina Search cache (per url+question, 24h TTL) ---

const SEARCH_CACHE = new Map<string, { result: string; fetchedAt: number }>();
const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SEARCH_CACHE_MAX = 500;
const SEARCH_TIMEOUT_MS = 10_000;
const SEARCH_RESULT_MAX_CHARS = 6_000; // ~1500 tokens

async function searchSiteContext(siteUrl: string, question: string): Promise<string | null> {
  let parsed: URL;
  try { parsed = new URL(siteUrl); } catch { return null; }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const domain = `${parsed.protocol}//${parsed.hostname}`;
  const cacheKey = `${domain}::${question}`;

  const now = Date.now();
  for (const [key, entry] of SEARCH_CACHE) {
    if (now - entry.fetchedAt > SEARCH_CACHE_TTL_MS) SEARCH_CACHE.delete(key);
  }

  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached) return cached.result;

  if (SEARCH_CACHE.size >= SEARCH_CACHE_MAX) {
    const oldest = [...SEARCH_CACHE.entries()].reduce((a, b) =>
      a[1].fetchedAt < b[1].fetchedAt ? a : b
    );
    SEARCH_CACHE.delete(oldest[0]);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
    const res = await fetch(`https://s.jina.ai/${encodeURIComponent(question)}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/plain',
        'X-Site': domain,
        'User-Agent': 'Phaysr-Widget-Backend/1.0',
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const text = await res.text();
    const result = text.slice(0, SEARCH_RESULT_MAX_CHARS);
    SEARCH_CACHE.set(cacheKey, { result, fetchedAt: Date.now() });
    return result;
  } catch {
    return null;
  }
}

// Paste text RAG — still needed for the pasted-context path
const STOPWORDS = new Set([
  'the','a','an','is','it','in','to','i','my','how','do','can',
  'what','where','when','why','does','did','be','are','was','have','has',
]);

function chunkText(text: string): string[] {
  return text
    .split(/(?=\n#{1,3}\s)|\n{2,}/)
    .map(s => s.trim())
    .filter(s => s.length > 30);
}

function scoreChunk(chunk: string, words: string[]): number {
  const lower = chunk.toLowerCase();
  return words.reduce((n, w) => n + (lower.includes(w) ? 1 : 0), 0);
}

function retrieveRelevantChunks(chunks: string[], question: string, topK = 3): string[] {
  const words = question.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
  return chunks
    .map(chunk => ({ chunk, score: scoreChunk(chunk, words) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(s => s.score > 0)
    .map(s => s.chunk);
}

// --- End context helpers ---

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
    '- Always reply in the same language the user used in their question.',
    '- ONE step per answer. Max 2 sentences. No markdown. No em dashes.',
    '- Only reference selectors from the DOM list.',
    '- Always address the user directly with imperative instructions ("Click the Add button", "Type your name"). Never use first person ("I need to click...", "I will...").',
    '- When you receive [CONTINUE]: the user already completed the previous step. Check the screenshot and DOM for current state, then give the NEXT step. Do not repeat the previous instruction.',
    '- If the screenshot or DOM shows an action is already done (e.g. a task already appears in a list), acknowledge it and move on.',
    '- If form fields are already filled, acknowledge this and move to the next step.',
    '- If element is not on current page, explain navigation only. No SELECTOR.',
    '- If element does not exist in the DOM list at all: say so directly and confidently. No hedging, no "may be", no "might".',
    '- If the question is unclear, off-topic, unrelated to navigating this site, or a trick question: politely decline, explain what you can help with, then return CONTINUE:done.',
    '',
    'End EVERY answer with exactly these two lines:',
    'SELECTOR:<selector-or-none>',
    'CONTINUE:<yes|no|done>',
    '',
    'CONTINUE values:',
    'yes  = more steps follow on this page',
    'no   = user must navigate to a different page first',
    'done = original goal is fully accomplished OR question was off-topic/unclear/unanswerable',
    ...(siteContext ? ['', 'Site context (use as a hint, not as ground truth — combine with what you see in the screenshot and DOM):', siteContext] : []),
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
      `Current URL: ${body.current_url}`,
      `Page title: ${body.page_title}`,
      '',
      'Visible DOM elements (JSON):',
      JSON.stringify(trimDomSnapshot(body.dom_snapshot), null, 2),
      '',
      `User question: ${body.question}`,
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

  const text = lines.slice(0, cutAt).join('\n').trim().replace(/\s*—\s*/g, ' ');
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

  // Resolve project from api_key. Allow the hardcoded demo key through without a project.
  const isDemo = body.api_key === 'demo_local';

  const project = body.api_key ? await findProjectByApiKey(body.api_key) : null;

  if (!project && !isDemo) {
    return c.json({ error: 'invalid_api_key' }, 401);
  }

  if (project) {
    const { data: projectUser } = await supabase.from('users').select('*').eq('id', project.user_id).single();
    if (projectUser && (projectUser as UserRow).subscription_status !== 'active') {
      const TRIAL_MS = 7 * 24 * 60 * 60 * 1000;
      const trialExpired = !(projectUser as UserRow).trial_started_at || Date.now() - (projectUser as UserRow).trial_started_at! > TRIAL_MS;
      if (trialExpired) {
        return c.json({ error: 'trial_expired' }, 402);
      }
    }
  }

  if (project?.allowed_domain) {
    const origin = c.req.header('origin') ?? '';
    const originHost = origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    const isLocalhost = originHost === 'localhost' || originHost.startsWith('localhost:') || originHost === '127.0.0.1';
    if (!isLocalhost && originHost !== project.allowed_domain) {
      return c.json({ error: 'domain_not_allowed' }, 403);
    }
  }

  // Never trust client-supplied site name/context — only use values from the DB project.
  // Demo mode gets a fixed name and no context to prevent prompt injection.
  const siteName = project?.site_name ?? 'Demo';
  const siteContext = project?.context;
  const contextUrl = project?.context_url;

  // Jina Search: semantic search across the entire domain, cached per (url+question)
  const urlContext = contextUrl ? await searchSiteContext(contextUrl, body.question) : null;
  if (contextUrl) {
    console.log(urlContext
      ? `[context_url] search OK — ${urlContext.length} chars`
      : `[context_url] search failed: ${contextUrl}`);
  }

  // RAG for pasted text: short text goes in as-is, long text gets chunked and filtered
  const PASTE_RAG_THRESHOLD = 600;
  let pasteChunks: string[];
  if (!siteContext) {
    pasteChunks = [];
  } else if (siteContext.length < PASTE_RAG_THRESHOLD) {
    pasteChunks = [siteContext];
  } else {
    pasteChunks = retrieveRelevantChunks(chunkText(siteContext), body.question, 2);
  }

  const parts = [urlContext, ...pasteChunks].filter(Boolean) as string[];
  const mergedContext = parts.length > 0 ? parts.join('\n\n---\n\n') : undefined;

  const system = buildSystemPrompt(siteName, mergedContext);

  const history: Anthropic.MessageParam[] = (body.conversation_history ?? []).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: 'user', content: buildUserContent(body) },
  ];

  return streamSSE(c, async (stream) => {
    // Emit debug info so the widget can log what context was used
    if (contextUrl) {
      await stream.writeSSE({
        event: 'context_info',
        data: JSON.stringify({
          url: contextUrl,
          fetched: !!urlContext,
          chars: urlContext?.length ?? 0,
        }),
      });
    }

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

        // Off-topic / redirect detection — AI said it can't help → treat as done
        const hasOffTopicSignal = /\b(only help|can(?:'t| not) help|not able to|outside|off.?topic|unrelated|not (related|relevant)|unclear|please (ask|rephrase|clarify)|try asking)\b/i.test(text);
        if (noHighlight && hasOffTopicSignal && !hasActionWord) {
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
      console.error('chat stream error:', err instanceof Error ? err.message : err);
      await stream.writeSSE({ event: 'error', data: JSON.stringify({ message: 'api_error' }) });
    }
  });
});
