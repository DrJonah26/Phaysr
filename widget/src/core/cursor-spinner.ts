let spinnerEl: HTMLDivElement | null = null;
let styleEl: HTMLStyleElement | null = null;

function ensureStyles() {
  if (styleEl) return;
  styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes phaysr-cursor-spin {
      to { transform: rotate(360deg); }
    }
    #phaysr-cursor-spinner {
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2.5px solid transparent;
      border-top-color: var(--phaysr-spinner-color, #9C5959);
      border-right-color: var(--phaysr-spinner-color, #9C5959);
      animation: phaysr-cursor-spin 0.65s linear infinite;
      opacity: 0.85;
    }
  `;
  document.head.appendChild(styleEl);
}

function onMouseMove(e: MouseEvent) {
  if (!spinnerEl) return;
  spinnerEl.style.left = `${e.clientX + 14}px`;
  spinnerEl.style.top = `${e.clientY + 4}px`;
}

export function showCursorSpinner(color: string) {
  if (spinnerEl) return;
  ensureStyles();

  spinnerEl = document.createElement('div');
  spinnerEl.id = 'phaysr-cursor-spinner';
  spinnerEl.style.setProperty('--phaysr-spinner-color', color);
  // Start offscreen until first mousemove
  spinnerEl.style.left = '-100px';
  spinnerEl.style.top = '-100px';
  document.body.appendChild(spinnerEl);
  document.addEventListener('mousemove', onMouseMove);
}

export function hideCursorSpinner() {
  document.removeEventListener('mousemove', onMouseMove);
  if (spinnerEl) {
    spinnerEl.remove();
    spinnerEl = null;
  }
}
