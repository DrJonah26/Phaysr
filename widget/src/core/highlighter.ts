const STYLE_ID = '__web_widget_highlight_styles__';
const RING_CLASS = '__web_widget_highlight_ring__';
const CURSOR_ID = '__web_widget_cursor__';
const GUIDE_OUTPUT_ID = '__web_widget_guide_output__';

const pendingHighlights = new Map<string, () => void>();

let lastCursorPos: { x: number; y: number } | null = null;
let currentHighlightCleanup: (() => void) | null = null;
let persistedCursorEl: HTMLElement | null = null;

let continueHandler: (() => void) | null = null;
let guideOutputEl: HTMLDivElement | null = null;
let guideOutputTextEl: HTMLDivElement | null = null;
let guideOutputMetaEl: HTMLDivElement | null = null;
let guideOutputButtonEl: HTMLButtonElement | null = null;
let guideOutputColor = '#3B82F6';
let lastHighlightRect: DOMRect | null = null;
let lastGuideOutputPos: { left: number; top: number } | null = null;
let guideOutputPendingReveal = false; // true when we have text but no target rect yet

export interface GuideOutputOptions {
  text: string;
  color?: string;
  isLoading?: boolean;
  canContinue?: boolean;
  continueLabel?: string;
  onContinue?: () => void;
  waitingForNav?: boolean;
  isDone?: boolean;
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
  el.style.display = 'block';
  el.style.opacity = '0';
  el.style.visibility = 'hidden';
  el.style.pointerEvents = 'none';
  el.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  el.style.color = '#101219';
  el.style.transitionProperty = 'left, top, opacity, visibility';
  el.style.transitionTimingFunction = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
  el.style.transitionDuration = '0s, 0s, 0.18s, 0.18s';

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

function rectsOverlap(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
): boolean {
  const PAD = 10;
  return (
    a.right + PAD > b.left &&
    a.left - PAD < b.right &&
    a.bottom + PAD > b.top &&
    a.top - PAD < b.bottom
  );
}

function positionGuideOutput() {
  if (!guideOutputEl) return;

  const tgt = lastHighlightRect;

  // No highlight target: if block is already placed, stay put — don't drift to cursor
  if (!tgt && lastGuideOutputPos) return;

  // No anchor at all yet — can't meaningfully position
  if (!tgt && !lastCursorPos) return;

  const margin = 12;
  const gap = 14;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const gW = guideOutputEl.offsetWidth || 280;
  const gH = guideOutputEl.offsetHeight || 120;

  // Candidate positions: right, left, below, above target element
  const candidates: Array<{ left: number; top: number }> = tgt
    ? [
        { left: tgt.right + gap,                        top: tgt.top + tgt.height / 2 - gH / 2 },
        { left: tgt.left - gW - gap,                    top: tgt.top + tgt.height / 2 - gH / 2 },
        { left: tgt.left + tgt.width / 2 - gW / 2,     top: tgt.bottom + gap },
        { left: tgt.left + tgt.width / 2 - gW / 2,     top: tgt.top - gH - gap },
        { left: (lastCursorPos?.x ?? W - 80) + gap,    top: (lastCursorPos?.y ?? H - 130) - gH / 2 },
      ]
    : [{ left: (lastCursorPos?.x ?? 260) + gap, top: (lastCursorPos?.y ?? H - 130) - gH / 2 }];

  for (const pos of candidates) {
    const left = Math.max(margin, Math.min(pos.left, W - gW - margin));
    const top  = Math.max(margin, Math.min(pos.top,  H - gH - margin));
    const g = { left, top, right: left + gW, bottom: top + gH };

    if (!tgt || !rectsOverlap(g, tgt)) {
      const newLeft = Math.round(left);
      const newTop  = Math.round(top);

      // Distance-based duration — same formula as cursor animation
      // Only animate when visible (avoid weird transition on first reveal)
      const isVisible = guideOutputEl.style.visibility !== 'hidden';
      if (isVisible && lastGuideOutputPos) {
        const dx = newLeft - lastGuideOutputPos.left;
        const dy = newTop  - lastGuideOutputPos.top;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ms = Math.max(800, Math.min(dist * 2.2, 3500));
        guideOutputEl.style.transitionDuration = `${ms}ms, ${ms}ms`;
      } else {
        // Snap to position instantly when hidden (pre-positioning)
        guideOutputEl.style.transitionDuration = '0ms, 0ms';
      }

      guideOutputEl.style.left = `${newLeft}px`;
      guideOutputEl.style.top  = `${newTop}px`;
      lastGuideOutputPos = { left: newLeft, top: newTop };
      return;
    }
  }

  // Absolute fallback: top-left corner
  const newLeft = margin;
  const newTop  = margin;
  guideOutputEl.style.left = `${newLeft}px`;
  guideOutputEl.style.top  = `${newTop}px`;
  lastGuideOutputPos = { left: newLeft, top: newTop };
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
  // Set highlight rect early so guide output calculates its final
  // non-overlapping position before the cursor animation starts —
  // combined with CSS transition this avoids the teleport-on-arrival.
  lastHighlightRect = rect;
  positionGuideOutput();
  // If guide output has text but was waiting for a target, reveal it now
  if (guideOutputPendingReveal && guideOutputEl && guideOutputEl.style.visibility === 'hidden') {
    guideOutputPendingReveal = false;
    guideOutputEl.style.opacity = '1';
    guideOutputEl.style.visibility = 'visible';
    guideOutputEl.style.pointerEvents = 'auto';
  }

  const endX = rect.left + rect.width * 0.3;
  const endY = rect.top - 10;

  // If a cursor is already on screen, fly from its position.
  // Otherwise fade-in directly at the target — no distracting entry flight.
  const hasPreviousCursor = persistedCursorEl !== null || lastCursorPos !== null;

  // Remove any previously persisted cursor before creating the new one
  persistedCursorEl?.remove();
  persistedCursorEl = null;

  const cursor = buildCursorEl(color);
  cursor.style.left = `${endX - 7}px`;
  cursor.style.top = `${endY - 7}px`;
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
    // Don't remove cursor — keep it visible while AI thinks next step
    persistedCursorEl = cursor;
    if (currentHighlightCleanup === cleanup) currentHighlightCleanup = null;
  };
  currentHighlightCleanup = cleanup;

  if (hasPreviousCursor) {
    // Fly from previous cursor position along a curved arc
    const startX = lastCursorPos?.x ?? endX;
    const startY = lastCursorPos?.y ?? endY;
    cursor.style.left = `${startX - 7}px`;
    cursor.style.top = `${startY - 7}px`;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const ddx = endX - startX;
    const ddy = endY - startY;
    const len = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
    const arcH = Math.min(len * 0.38, 220);
    const ctrlX = Math.max(20, Math.min(window.innerWidth - 20, midX + (-ddy / len) * arcH));
    const ctrlY = Math.max(20, Math.min(window.innerHeight - 20, midY + (ddx / len) * arcH));
    const duration = Math.max(1000, Math.min(len * 2.2, 3000));

    await animateCursor(cursor, startX, startY, ctrlX, ctrlY, endX, endY, duration);
    if (cancelled) return;
  } else {
    // First appearance — fade in at target position
    cursor.style.opacity = '0';
    cursor.style.transition = 'opacity 0.4s ease-out';
    requestAnimationFrame(() => {
      if (cancelled) return;
      cursor.style.opacity = '1';
    });
  }

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

    lastHighlightRect = r;

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

  // Hide while AI is loading with no text yet — block reappears once text streams in
  if (options.isLoading && !cleanText) {
    guideOutputEl.style.opacity = '0';
    guideOutputEl.style.visibility = 'hidden';
    guideOutputEl.style.pointerEvents = 'none';
    return;
  }

  guideOutputTextEl.textContent = cleanText;

  if (options.waitingForNav) {
    guideOutputMetaEl.textContent = 'Waiting for navigation...';
  } else {
    guideOutputMetaEl.textContent = '';
  }

  const canContinue = Boolean(options.canContinue);
  const isDone = Boolean(options.isDone);
  continueHandler = canContinue && options.onContinue
    ? options.onContinue
    : isDone
      ? () => {
          hideGuideOutput();
          clearHighlights();
          // Remove cursor: tracked ref first, then DOM fallback for robustness
          (persistedCursorEl ?? document.getElementById(CURSOR_ID))?.remove();
          persistedCursorEl = null;
          lastCursorPos = null;
          // Remove any rings still in DOM (safety net)
          document.querySelectorAll(`.${RING_CLASS}`).forEach((el) => el.remove());
        }
      : null;

  const showButton = canContinue || isDone;
  guideOutputButtonEl.textContent = isDone ? 'Done ✓' : (options.continueLabel ?? 'Continue');
  guideOutputButtonEl.style.display = showButton ? 'inline-flex' : 'none';
  guideOutputButtonEl.style.background = isDone ? '#22c55e' : guideOutputColor;
  guideOutputButtonEl.disabled = Boolean(options.isLoading) || !showButton;
  guideOutputButtonEl.style.opacity = guideOutputButtonEl.disabled ? '0.5' : '1';
  guideOutputButtonEl.style.cursor = guideOutputButtonEl.disabled ? 'not-allowed' : 'pointer';

  const shouldHide = !cleanText && !options.isLoading && !canContinue;
  if (shouldHide) {
    guideOutputEl.style.opacity = '0';
    guideOutputEl.style.visibility = 'hidden';
    guideOutputEl.style.pointerEvents = 'none';
    return;
  }

  positionGuideOutput();

  // If we have no anchor yet (first step, highlight hasn't arrived):
  // - while still loading: stay hidden until drawRingWithCursor reveals us
  // - once loading is done (SELECTOR:none case): show above the input dock
  if (!lastHighlightRect && !lastGuideOutputPos) {
    if (options.isLoading !== false) {
      guideOutputPendingReveal = true;
      return;
    }
    // No highlight target and stream is done — position above input dock (bottom-right)
    const W = window.innerWidth;
    const H = window.innerHeight;
    const gW = guideOutputEl.offsetWidth || 280;
    const gH = guideOutputEl.offsetHeight || 120;
    const margin = 12;
    const left = Math.max(margin, W - gW - 80);
    const top = Math.max(margin, H - gH - 110);
    guideOutputEl.style.transitionDuration = '0ms, 0ms';
    guideOutputEl.style.left = `${left}px`;
    guideOutputEl.style.top = `${top}px`;
    lastGuideOutputPos = { left, top };
  }

  guideOutputPendingReveal = false;
  guideOutputEl.style.opacity = '1';
  guideOutputEl.style.visibility = 'visible';
  guideOutputEl.style.pointerEvents = 'auto';
}

/** Hide visually but keep all state (position, cursor, colors) intact.
 *  Use this at the start of a new loading cycle. */
export function collapseGuideOutput() {
  if (guideOutputEl) {
    guideOutputEl.style.opacity = '0';
    guideOutputEl.style.visibility = 'hidden';
    guideOutputEl.style.pointerEvents = 'none';
  }
  guideOutputPendingReveal = false;
}

export function hideGuideOutput() {
  continueHandler = null;
  guideOutputEl?.remove();
  guideOutputEl = null;
  guideOutputTextEl = null;
  guideOutputMetaEl = null;
  guideOutputButtonEl = null;
  lastGuideOutputPos = null;
  guideOutputPendingReveal = false;
}

export function clearHighlights() {
  currentHighlightCleanup?.();
  pendingHighlights.forEach((cancel) => cancel());
  pendingHighlights.clear();
  document.querySelectorAll(`.${RING_CLASS}`).forEach((el) => el.remove());
  // Cursor intentionally NOT removed here — it stays visible while AI thinks
  lastHighlightRect = null;
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
