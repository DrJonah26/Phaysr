const STYLE_ID = '__web_widget_highlight_styles__';
const RING_CLASS = '__web_widget_highlight_ring__';
const CURSOR_ID = '__web_widget_cursor__';
const GUIDE_OUTPUT_ID = '__web_widget_guide_output__';

const pendingHighlights = new Map<string, () => void>();

let lastCursorPos: { x: number; y: number } | null = null;
let currentHighlightCleanup: (() => void) | null = null;

let continueHandler: (() => void) | null = null;
let guideOutputEl: HTMLDivElement | null = null;
let guideOutputTextEl: HTMLDivElement | null = null;
let guideOutputMetaEl: HTMLDivElement | null = null;
let guideOutputButtonEl: HTMLButtonElement | null = null;
let guideOutputColor = '#3B82F6';

export interface GuideOutputOptions {
  text: string;
  color?: string;
  isLoading?: boolean;
  advisorActive?: boolean;
  canContinue?: boolean;
  continueLabel?: string;
  onContinue?: () => void;
}

function bezier(t: number, p0: number, p1: number, p2: number): number {
  return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function waitForScrollEnd(): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, 420);
    window.addEventListener('scrollend', () => {
      window.clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

function ensureStyles(color: string) {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes __web_widget_cursor_wait__ {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.5); opacity: 0.75; }
    }
    @keyframes __web_widget_pulse__ {
      0% { box-shadow: 0 0 0 0 ${color}66; }
      70% { box-shadow: 0 0 0 14px ${color}00; }
      100% { box-shadow: 0 0 0 0 ${color}00; }
    }
    .${RING_CLASS} {
      position: fixed;
      border: 3px solid ${color};
      border-radius: 8px;
      pointer-events: none;
      z-index: 2147483646;
      animation: __web_widget_pulse__ 1.5s ease-in-out infinite;
      transition: top 0.2s, left 0.2s, width 0.2s, height 0.2s;
    }
  `;
  document.head.appendChild(style);
}

function buildCursorEl(color: string): HTMLElement {
  const el = document.createElement('div');
  el.id = CURSOR_ID;
  el.style.position = 'fixed';
  el.style.pointerEvents = 'none';
  el.style.zIndex = '2147483647';
  el.style.transformOrigin = '7px 7px';
  el.style.width = '14px';
  el.style.height = '14px';
  el.style.borderRadius = '50%';
  el.style.background = `radial-gradient(circle, #ffffff 0%, ${color} 45%, ${color}00 100%)`;
  el.style.boxShadow = `0 0 7px 3px ${color}99`;
  return el;
}

function ensureGuideOutput() {
  if (guideOutputEl) return;

  const el = document.createElement('div');
  el.id = GUIDE_OUTPUT_ID;
  el.style.position = 'fixed';
  el.style.zIndex = '2147483647';
  el.style.maxWidth = '320px';
  el.style.minWidth = '220px';
  el.style.padding = '12px';
  el.style.borderRadius = '12px';
  el.style.background = 'rgba(255, 255, 255, 0.97)';
  el.style.border = '2px solid #3B82F6';
  el.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.22)';
  el.style.backdropFilter = 'blur(10px)';
  el.style.display = 'none';
  el.style.pointerEvents = 'auto';
  el.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  el.style.color = '#101219';

  const text = document.createElement('div');
  text.style.fontSize = '12px';
  text.style.lineHeight = '1.45';
  text.style.whiteSpace = 'pre-wrap';
  text.style.wordBreak = 'break-word';
  text.style.minHeight = '18px';

  const footer = document.createElement('div');
  footer.style.marginTop = '10px';
  footer.style.display = 'flex';
  footer.style.alignItems = 'center';
  footer.style.justifyContent = 'space-between';
  footer.style.gap = '10px';

  const meta = document.createElement('div');
  meta.style.fontSize = '11px';
  meta.style.color = '#5f6573';

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Continue';
  button.style.border = 'none';
  button.style.borderRadius = '8px';
  button.style.padding = '6px 10px';
  button.style.color = 'white';
  button.style.background = guideOutputColor;
  button.style.fontSize = '11px';
  button.style.fontWeight = '600';
  button.style.cursor = 'pointer';
  button.style.display = 'none';
  button.addEventListener('click', () => {
    continueHandler?.();
  });

  footer.appendChild(meta);
  footer.appendChild(button);
  el.appendChild(text);
  el.appendChild(footer);
  document.body.appendChild(el);

  guideOutputEl = el;
  guideOutputTextEl = text;
  guideOutputMetaEl = meta;
  guideOutputButtonEl = button;
}

function positionGuideOutput() {
  if (!guideOutputEl || guideOutputEl.style.display === 'none') return;

  const anchorX = lastCursorPos?.x ?? 260;
  const anchorY = lastCursorPos?.y ?? Math.max(110, window.innerHeight - 130);

  const gap = 18;
  const margin = 12;
  const rect = guideOutputEl.getBoundingClientRect();

  let left = anchorX + gap;
  let top = anchorY - rect.height * 0.5;

  if (left + rect.width + margin > window.innerWidth) {
    left = anchorX - rect.width - gap;
  }
  if (left < margin) left = margin;
  if (top < margin) top = margin;
  if (top + rect.height + margin > window.innerHeight) {
    top = window.innerHeight - rect.height - margin;
  }

  guideOutputEl.style.left = `${Math.round(left)}px`;
  guideOutputEl.style.top = `${Math.round(top)}px`;
}

function updateCursorAnchor(x: number, y: number) {
  lastCursorPos = { x, y };
  positionGuideOutput();
}

function animateCursor(
  cursor: HTMLElement,
  sx: number, sy: number,
  cx: number, cy: number,
  ex: number, ey: number,
  duration: number,
): Promise<void> {
  return new Promise((resolve) => {
    const t0 = performance.now();

    function tick(now: number) {
      const raw = Math.min((now - t0) / duration, 1);
      const t = easeInOut(raw);

      const x = bezier(t, sx, cx, ex);
      const y = bezier(t, sy, cy, ey);
      const scale = 1 + 0.4 * Math.sin(raw * Math.PI);

      cursor.style.left = `${x - 7}px`;
      cursor.style.top = `${y - 7}px`;
      cursor.style.transform = `scale(${scale})`;
      updateCursorAnchor(x, y);

      if (raw < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

async function drawRingWithCursor(target: Element, color: string): Promise<void> {
  ensureStyles(color);

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await waitForScrollEnd();

  const rect = target.getBoundingClientRect();
  const endX = rect.left + rect.width * 0.3;
  const endY = rect.top - 10;

  const startX = lastCursorPos?.x ?? window.innerWidth - 72;
  const startY = lastCursorPos?.y ?? window.innerHeight - 72;

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const ddx = endX - startX;
  const ddy = endY - startY;
  const len = Math.sqrt(ddx * ddx + ddy * ddy) || 1;

  const arcH = Math.min(len * 0.38, 220);
  const ctrlX = Math.max(20, Math.min(window.innerWidth - 20, midX + (-ddy / len) * arcH));
  const ctrlY = Math.max(20, Math.min(window.innerHeight - 20, midY + (ddx / len) * arcH));
  const duration = Math.max(1000, Math.min(len * 2.2, 3000));

  const cursor = buildCursorEl(color);
  cursor.style.left = `${startX - 7}px`;
  cursor.style.top = `${startY - 7}px`;
  document.body.appendChild(cursor);

  let intervalId = 0;
  let fallbackId = 0;
  let cancelled = false;
  let ring: HTMLDivElement | null = null;

  const cleanup = () => {
    if (cancelled) return;
    cancelled = true;
    window.clearInterval(intervalId);
    window.clearTimeout(fallbackId);
    ring?.remove();
    cursor.remove();
    if (currentHighlightCleanup === cleanup) currentHighlightCleanup = null;
  };
  currentHighlightCleanup = cleanup;

  await animateCursor(cursor, startX, startY, ctrlX, ctrlY, endX, endY, duration);
  if (cancelled) return;

  cursor.style.transform = 'scale(1)';
  cursor.style.animation = '__web_widget_cursor_wait__ 1.2s ease-in-out infinite';
  updateCursorAnchor(endX, endY);

  ring = document.createElement('div');
  ring.className = RING_CLASS;
  ring.style.opacity = '0';
  document.body.appendChild(ring);

  const reposition = () => {
    if (cancelled) return;
    const r = target.getBoundingClientRect();
    ring!.style.top = `${r.top - 4}px`;
    ring!.style.left = `${r.left - 4}px`;
    ring!.style.width = `${r.width + 8}px`;
    ring!.style.height = `${r.height + 8}px`;

    const cursorX = r.left + r.width * 0.3;
    const cursorY = r.top - 7;
    cursor.style.left = `${cursorX - 7}px`;
    cursor.style.top = `${cursorY - 7}px`;
    updateCursorAnchor(cursorX, cursorY);
  };
  reposition();

  requestAnimationFrame(() => {
    if (cancelled) return;
    ring!.style.transition = 'opacity 0.25s ease-out';
    ring!.style.opacity = '1';
  });

  fallbackId = window.setTimeout(cleanup, 60_000);
  intervalId = window.setInterval(reposition, 200);
}

export function showGuideOutput(options: GuideOutputOptions) {
  ensureGuideOutput();
  if (!guideOutputEl || !guideOutputTextEl || !guideOutputMetaEl || !guideOutputButtonEl) return;

  guideOutputColor = options.color ?? guideOutputColor;
  guideOutputEl.style.borderColor = guideOutputColor;
  guideOutputButtonEl.style.background = guideOutputColor;

  const cleanText = options.text.trim();
  guideOutputTextEl.textContent = cleanText || (options.isLoading ? '...' : '');

  if (options.advisorActive) {
    guideOutputMetaEl.textContent = 'Advisor denkt nach...';
  } else if (options.isLoading) {
    guideOutputMetaEl.textContent = 'KI denkt nach...';
  } else {
    guideOutputMetaEl.textContent = '';
  }

  const canContinue = Boolean(options.canContinue);
  continueHandler = canContinue && options.onContinue ? options.onContinue : null;

  guideOutputButtonEl.textContent = options.continueLabel ?? 'Continue';
  guideOutputButtonEl.style.display = canContinue ? 'inline-flex' : 'none';
  guideOutputButtonEl.disabled = Boolean(options.isLoading) || !canContinue;
  guideOutputButtonEl.style.opacity = guideOutputButtonEl.disabled ? '0.5' : '1';
  guideOutputButtonEl.style.cursor = guideOutputButtonEl.disabled ? 'not-allowed' : 'pointer';

  const shouldHide = !cleanText && !options.isLoading && !canContinue;
  guideOutputEl.style.display = shouldHide ? 'none' : 'block';
  positionGuideOutput();
}

export function hideGuideOutput() {
  continueHandler = null;
  guideOutputEl?.remove();
  guideOutputEl = null;
  guideOutputTextEl = null;
  guideOutputMetaEl = null;
  guideOutputButtonEl = null;
}

export function clearHighlights() {
  currentHighlightCleanup?.();
  pendingHighlights.forEach((cancel) => cancel());
  pendingHighlights.clear();
  document.querySelectorAll(`.${RING_CLASS}`).forEach((el) => el.remove());
  document.getElementById(CURSOR_ID)?.remove();
}

export function highlightElement(selector: string, color = '#3B82F6'): boolean {
  if (selector === 'none') return true;

  let target: Element | null = null;
  try {
    target = document.querySelector(selector);
  } catch {
    return false;
  }

  if (target) {
    void drawRingWithCursor(target, color);
    return true;
  }

  const timeoutMs = 8000;

  const observer = new MutationObserver(() => {
    let el: Element | null = null;
    try {
      el = document.querySelector(selector);
    } catch {
      // invalid selector
    }
    if (!el) return;

    observer.disconnect();
    window.clearTimeout(timeoutId);
    pendingHighlights.delete(selector);
    void drawRingWithCursor(el, color);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const timeoutId = window.setTimeout(() => {
    observer.disconnect();
    pendingHighlights.delete(selector);
  }, timeoutMs);

  pendingHighlights.set(selector, () => {
    observer.disconnect();
    window.clearTimeout(timeoutId);
  });

  return false;
}
