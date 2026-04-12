export type ChatStreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'highlight'; selector: string }
  | { type: 'can_continue'; value: 'yes' | 'no' | 'done' }
  | { type: 'advisor'; status: string }
  | { type: 'error'; message: string }
  | { type: 'done' };

export interface ChatStreamRequest {
  backendUrl: string;
  body: unknown;
  signal?: AbortSignal;
}

export async function* streamChat(req: ChatStreamRequest): AsyncGenerator<ChatStreamEvent> {
  const res = await fetch(`${req.backendUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
    signal: req.signal,
  });

  if (!res.ok) {
    let msg = `http_${res.status}`;
    try {
      const j = await res.json();
      msg = (j as { error?: string }).error ?? msg;
    } catch {
      // ignore
    }
    yield { type: 'error', message: msg };
    return;
  }

  if (!res.body) {
    yield { type: 'error', message: 'no_response_body' };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split(/\n\n/);
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      const ev = parseSSEBlock(block);
      if (ev) yield ev;
    }
  }

  const tail = parseSSEBlock(buffer);
  if (tail) yield tail;
}

function parseSSEBlock(block: string): ChatStreamEvent | null {
  if (!block.trim()) return null;
  let event = 'message';
  let data = '';
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }

  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    switch (event) {
      case 'text':
        return { type: 'text', delta: parsed.delta ?? '' };
      case 'highlight':
        return { type: 'highlight', selector: parsed.selector ?? '' };
      case 'advisor':
        return { type: 'advisor', status: parsed.status ?? 'thinking' };
      case 'error':
        return { type: 'error', message: parsed.message ?? 'unknown_error' };
      case 'can_continue':
        return { type: 'can_continue', value: parsed.value as 'yes' | 'no' | 'done' };
      case 'done':
        return { type: 'done' };
      default:
        return null;
    }
  } catch {
    return null;
  }
}
