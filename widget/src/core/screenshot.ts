import html2canvas from 'html2canvas';

// html2canvas doesn't support modern CSS color functions like oklch() (used by Tailwind v4).
// We pre-process cloned elements to replace unsupported colors with a safe fallback.
function stripUnsupportedColors(doc: Document) {
  const all = doc.querySelectorAll<HTMLElement>('*');
  const OKLCH_RE = /oklch\([^)]*\)/gi;
  for (const el of Array.from(all)) {
    try {
      const style = el.getAttribute('style') ?? '';
      if (OKLCH_RE.test(style)) {
        el.setAttribute('style', style.replace(OKLCH_RE, 'transparent'));
        OKLCH_RE.lastIndex = 0;
      }
    } catch {
      // ignore individual element errors
    }
  }
}

export async function captureScreenshot(hideElement?: HTMLElement | null): Promise<string> {
  const previousVisibility = hideElement?.style.visibility ?? '';
  if (hideElement) {
    hideElement.style.visibility = 'hidden';
  }

  try {
    const canvas = await html2canvas(document.body, {
      scale: 0.5,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      x: window.scrollX,
      y: window.scrollY,
      ignoreElements: (el) => Boolean(hideElement && hideElement.contains(el)),
      onclone: (_clonedDoc, clonedEl) => {
        // Remove Tailwind stylesheet links from clone to prevent oklch re-injection
        // and strip any inline oklch colors
        stripUnsupportedColors(clonedEl.ownerDocument);
      },
    });
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    // html2canvas fails on some CSS (e.g. oklch) — fall back to DOM-only mode silently
    return '';
  } finally {
    if (hideElement) {
      hideElement.style.visibility = previousVisibility;
    }
  }
}
