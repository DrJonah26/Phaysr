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

export function getUniqueSelector(el: Element): string {
  const testId = el.getAttribute('data-testid');
  if (testId) {
    const sel = `[data-testid="${testId}"]`;
    if (isUniqueSelector(sel)) return sel;
  }

  if (el.id) {
    const sel = `#${escapeIdent(el.id)}`;
    if (isUniqueSelector(sel)) return sel;
  }

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    const sel = `[aria-label="${ariaLabel}"]`;
    if (isUniqueSelector(sel)) return sel;
  }

  const nameAttr = el.getAttribute('name');
  if (nameAttr) {
    const sel = `${el.tagName.toLowerCase()}[name="${nameAttr}"]`;
    if (isUniqueSelector(sel)) return sel;
  }

  const placeholder = el.getAttribute('placeholder');
  if (placeholder && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
    const sel = `${el.tagName.toLowerCase()}[placeholder="${placeholder}"]`;
    if (isUniqueSelector(sel)) return sel;
  }

  const parts: string[] = [];
  let current: Element | null = el;
  let depth = 0;
  while (current && current !== document.body && depth < 6) {
    let part = current.tagName.toLowerCase();
    if (current.id) {
      part = `#${escapeIdent(current.id)}`;
      parts.unshift(part);
      break;
    }

    const className = (current as HTMLElement).className;
    if (typeof className === 'string' && className.trim()) {
      const cls = className
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((c) => `.${escapeIdent(c)}`)
        .join('');
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

export interface InputValueSnapshot {
  selector: string;
  value: string;
  placeholder: string | null;
  type: string | null;
}

export function getInputValues(excludeRoot?: Element | null): InputValueSnapshot[] {
  const inputs = document.querySelectorAll('input, textarea, select');
  const result: InputValueSnapshot[] = [];

  for (const el of Array.from(inputs)) {
    if (excludeRoot && excludeRoot.contains(el)) continue;
    if (!isVisible(el)) continue;

    const value = (el as HTMLInputElement).value?.trim() ?? '';
    if (!value) continue; // only filled fields

    result.push({
      selector: getUniqueSelector(el),
      value: value.slice(0, 200),
      placeholder: el.getAttribute('placeholder'),
      type: el.getAttribute('type'),
    });
  }

  return result;
}

export function getDOMSnapshot(excludeRoot?: Element | null): DOMElementSnapshot[] {
  const elements = document.querySelectorAll(SELECTOR_QUERY);
  const result: DOMElementSnapshot[] = [];

  for (const el of Array.from(elements)) {
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
