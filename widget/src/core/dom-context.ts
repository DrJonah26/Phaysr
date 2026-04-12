export interface DOMElementSnapshot {
  tag: string;
  text?: string;
  selector: string;
  ariaLabel?: string | null;
  role?: string | null;
  boundingBox: { x: number; y: number; width: number; height: number };
}

const SELECTOR_QUERY =
  'button, a, input, select, textarea, h1, h2, h3, nav, [role], [aria-label], [data-testid]';

// Fix 1: IDs of elements the widget injects directly into document.body
// (outside Shadow DOM, so excludeRoot.contains() won't catch them)
const WIDGET_IDS = [
  '__web_widget_host__',
  '__web_widget_guide_output__',
  '__web_widget_cursor__',
];
const WIDGET_RING_CLASS = '__web_widget_highlight_ring__';

function isWidgetElement(el: Element): boolean {
  if (WIDGET_IDS.includes(el.id)) return true;
  if (el.classList.contains(WIDGET_RING_CLASS)) return true;
  for (const id of WIDGET_IDS) {
    if (el.closest(`#${id}`)) return true;
  }
  return false;
}

export function isVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
  if (rect.right < 0 || rect.left > window.innerWidth) return false;

  const style = window.getComputedStyle(el);
  if (style.display === 'none') return false;
  if (style.visibility === 'hidden') return false;
  if (style.opacity === '0') return false;

  return true;
}

function escapeIdent(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

function isUniqueSelector(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

// Fix 3: filter out hash-generated class names
// Keeps semantic classes (bg-blue-500, btn-primary, nav__item)
// Drops generated ones (sc-abc123, _a1b2c3, purely alphanumeric with digits ≥6 chars)
function isStableClass(cls: string): boolean {
  if (!cls) return false;
  // styled-components: sc-<hash>
  if (/^sc-[a-zA-Z0-9]+$/i.test(cls)) return false;
  // Pure hex hash: abc12def, 1a2b3c4d
  if (/^[a-f0-9]{6,}$/i.test(cls)) return false;
  // CSS Modules with hash suffix: _container_1a2b3c or ComponentName__root___hash
  if (/_{1,2}[a-zA-Z0-9]{5,}$/.test(cls)) return false;
  // Purely alphanumeric with digits and 6+ chars — likely generated
  if (/^[a-zA-Z0-9]{6,}$/.test(cls) && /\d/.test(cls)) return false;
  return true;
}

function getStableClasses(el: Element): string {
  const raw = (el as HTMLElement).className;
  if (typeof raw !== 'string') return '';
  return raw.trim().split(/\s+/).filter(isStableClass).slice(0, 2).join(' ');
}

export function getUniqueSelector(el: Element): string {
  // 1. data-testid — most stable, explicit
  const testId = el.getAttribute('data-testid');
  if (testId) {
    const sel = `[data-testid="${testId}"]`;
    if (isUniqueSelector(sel)) return sel;
  }

  // 2. Stable ID (not hash-generated)
  if (el.id && isStableClass(el.id)) {
    const sel = `#${escapeIdent(el.id)}`;
    if (isUniqueSelector(sel)) return sel;
  }

  // 3. aria-label — semantic and stable
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    const sel = `${el.tagName.toLowerCase()}[aria-label="${ariaLabel}"]`;
    if (isUniqueSelector(sel)) return sel;
  }

  // 4. name attribute (inputs, selects, buttons)
  const name = el.getAttribute('name');
  if (name) {
    const sel = `${el.tagName.toLowerCase()}[name="${name}"]`;
    if (isUniqueSelector(sel)) return sel;
  }

  // 5. Structural path using only stable classes
  const parts: string[] = [];
  let current: Element | null = el;
  let depth = 0;
  while (current && current !== document.body && depth < 6) {
    let part = current.tagName.toLowerCase();

    if (current.id && isStableClass(current.id)) {
      part = `#${escapeIdent(current.id)}`;
      parts.unshift(part);
      break;
    }

    const stableClasses = getStableClasses(current);
    if (stableClasses) {
      const cls = stableClasses.split(/\s+/).map((c) => `.${escapeIdent(c)}`).join('');
      part += cls;
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        part += `:nth-of-type(${idx})`;
      }
    }

    parts.unshift(part);
    current = current.parentElement;
    depth++;
  }

  const selector = parts.join(' > ');
  return selector || el.tagName.toLowerCase();
}

export function getDOMSnapshot(excludeRoot?: Element | null): DOMElementSnapshot[] {
  const elements = document.querySelectorAll(SELECTOR_QUERY);
  const result: DOMElementSnapshot[] = [];

  for (const el of Array.from(elements)) {
    // Fix 1: exclude the widget's own injected elements
    if (isWidgetElement(el)) continue;
    if (excludeRoot && excludeRoot.contains(el)) continue;
    if (!isVisible(el)) continue;

    const rect = el.getBoundingClientRect();
    result.push({
      tag: el.tagName.toLowerCase(),
      text: el.textContent?.trim().slice(0, 100) || undefined,
      selector: getUniqueSelector(el),
      ariaLabel: el.getAttribute('aria-label'),
      role: el.getAttribute('role'),
      boundingBox: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    });

    if (result.length >= 150) break;
  }

  return result;
}
